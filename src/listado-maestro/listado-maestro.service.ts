import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IListadoMaestro } from './ListadoMaestro.Model';
import { IFormatos } from '../formatos/Formatos.Model';
import { IPropuesta } from '../Propuestas/PropuestasModel';
import { 
  CreateListadoMaestroDto, 
  UpdateListadoMaestroDto, 
  CambiarEstadoDto, 
  FiltrosListadoMaestroDto,
  ExportarExcelDto,
  EstadoDocumentoEnum
} from './ListadoMaestroDto';
import { CodigoGeneratorService } from './CodigoGenerator.service';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import * as nodemailer from 'nodemailer';
import 'dotenv/config';

@Injectable()
export class ListadoMaestroService {
  private transporter: nodemailer.Transporter;
  private readonly adminUsers = [
    { nombre: 'Margarita Ramirez', mail: 'margaritaramirez1314@gmail.com' },
    { nombre: 'Diana Marin', mail: 'dipamato@gmail.com' },
    { nombre: 'Ana Ospina', mail: 'anaisabelospina9@gmail.com' },
  ];

  constructor(
    @InjectModel('ListadoMaestro') private listadoMaestroModel: Model<IListadoMaestro>,
    @InjectModel('Formatos') private formatoModel: Model<IFormatos>,
    @InjectModel('Propuestas') private propuestaModel: Model<IPropuesta>,
    private codigoGeneratorService: CodigoGeneratorService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  /**
 * Crear registro desde formato existente
 */
async createFromFormato(formato: IFormatos): Promise<IListadoMaestro> {
  const codigoInfo = this.codigoGeneratorService.parseCodigoInfo(formato.codigo);
  
  const nuevoDocumento = new this.listadoMaestroModel({
    codigo: formato.codigo,
    nombre: formato.nombre,
    proceso: codigoInfo.proceso || 'direccion',
    tipoDocumento: formato.tipo === 'formato' ? 'registro' : formato.tipo,
    version: formato.version,
    fechaCreacion: new Date(),
    responsable: 'Por definir', // Requiere actualización manual
    estado: EstadoDocumentoEnum.APROBADO, // Formatos existentes están aprobados
    vigencia: formato.vigencia,
    activo: true
  });

  return await nuevoDocumento.save();
}

  /**
   * Crear nuevo documento en el listado maestro
   */
  async createDocument(createDto: CreateListadoMaestroDto): Promise<IListadoMaestro> {
    // Validar que el código no exista
    const codigoExists = await this.codigoGeneratorService.isCodigoExists(createDto.codigo);
    if (codigoExists) {
      throw new ConflictException(`El código ${createDto.codigo} ya existe en el sistema`);
    }

    // Validar formato del código
    const codigoValidation = this.codigoGeneratorService.validateCodigoFormat(createDto.codigo);
    if (!codigoValidation.isValid) {
      throw new BadRequestException(codigoValidation.error);
    }

    // Crear el documento
    const nuevoDocumento = new this.listadoMaestroModel({
      ...createDto,
      fechaCreacion: new Date(),
      estado: createDto.estado || EstadoDocumentoEnum.BORRADOR,
      propuestasPendientes: [],
      activo: createDto.activo !== undefined ? createDto.activo : true
    });

    const documentoCreado = await nuevoDocumento.save();

    // Si el estado es pendiente_aprobacion, enviar notificación
    if (documentoCreado.estado === EstadoDocumentoEnum.PENDIENTE_APROBACION) {
      await this.sendApprovalRequestNotification(documentoCreado);
    }

    return documentoCreado;
  }

  /**
   * Generar código automático y crear documento
   */
  async createDocumentWithAutoCode(createDto: Omit<CreateListadoMaestroDto, 'codigo'>): Promise<IListadoMaestro> {
    // Generar código automático
    const codigo = await this.codigoGeneratorService.generateNextCode(
      createDto.proceso,
      createDto.tipoDocumento
    );

    return this.createDocument({ ...createDto, codigo });
  }

  /**
   * Obtener todos los documentos con filtros
   */
  async findAll(filtros?: FiltrosListadoMaestroDto): Promise<IListadoMaestro[]> {
    const query: any = {};

    if (filtros) {
      if (filtros.proceso) query.proceso = filtros.proceso;
      if (filtros.tipoDocumento) query.tipoDocumento = filtros.tipoDocumento;
      if (filtros.estado) query.estado = filtros.estado;
      if (filtros.responsable) query.responsable = new RegExp(filtros.responsable, 'i');
      if (filtros.activo !== undefined) query.activo = filtros.activo;
      
      if (filtros.busqueda) {
        query.$or = [
          { codigo: new RegExp(filtros.busqueda, 'i') },
          { nombre: new RegExp(filtros.busqueda, 'i') }
        ];
      }
    }

    return await this.listadoMaestroModel
      .find(query)
      .populate('formatoId')
      .populate('propuestasPendientes')
      .sort({ fechaCreacion: -1 })
      .exec();
  }

  /**
   * Obtener documento por ID
   */
  async findOne(id: string): Promise<IListadoMaestro> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de documento inválido');
    }

    const documento = await this.listadoMaestroModel
      .findById(id)
      .populate('formatoId')
      .populate('propuestasPendientes')
      .exec();

    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }

    return documento;
  }

  /**
   * Buscar documento por código
   */
  async findByCodigo(codigo: string): Promise<IListadoMaestro> {
    const documento = await this.listadoMaestroModel
      .findOne({ codigo, activo: true })
      .populate('formatoId')
      .populate('propuestasPendientes')
      .exec();

    if (!documento) {
      throw new NotFoundException(`Documento con código ${codigo} no encontrado`);
    }

    return documento;
  }

  /**
   * Actualizar documento
   */
  async updateDocument(id: string, updateDto: UpdateListadoMaestroDto): Promise<IListadoMaestro> {
    const documento = await this.findOne(id);

    // Si se cambia el código, validar que no exista
    if (updateDto.codigo && updateDto.codigo !== documento.codigo) {
      const codigoExists = await this.codigoGeneratorService.isCodigoExists(updateDto.codigo);
      if (codigoExists) {
        throw new ConflictException(`El código ${updateDto.codigo} ya existe en el sistema`);
      }

      const codigoValidation = this.codigoGeneratorService.validateCodigoFormat(updateDto.codigo);
      if (!codigoValidation.isValid) {
        throw new BadRequestException(codigoValidation.error);
      }
    }

    // Actualizar campos
    Object.assign(documento, updateDto);
    documento.fechaActualizacion = new Date();

    return await documento.save();
  }

  /**
   * Aprobar documento
   */
  async approveDocument(cambiarEstadoDto: CambiarEstadoDto): Promise<IListadoMaestro> {
    const documento = await this.findOne(cambiarEstadoDto.documentoId);

    if (documento.estado !== EstadoDocumentoEnum.PENDIENTE_APROBACION) {
      throw new BadRequestException('Solo se pueden aprobar documentos en estado "pendiente_aprobacion"');
    }

    documento.estado = EstadoDocumentoEnum.APROBADO;
    documento.fechaActualizacion = new Date();
    
    if (cambiarEstadoDto.motivoCambio) {
      documento.motivoCambio = cambiarEstadoDto.motivoCambio;
      documento.fechaCambio = new Date();
    }

    const documentoAprobado = await documento.save();

    // Enviar notificación de aprobación
    await this.sendStatusChangeNotification(documentoAprobado, 'aprobado', cambiarEstadoDto);

    return documentoAprobado;
  }

  /**
   * Rechazar documento
   */
  async rejectDocument(cambiarEstadoDto: CambiarEstadoDto): Promise<IListadoMaestro> {
    const documento = await this.findOne(cambiarEstadoDto.documentoId);

    if (documento.estado !== EstadoDocumentoEnum.PENDIENTE_APROBACION) {
      throw new BadRequestException('Solo se pueden rechazar documentos en estado "pendiente_aprobacion"');
    }

    documento.estado = EstadoDocumentoEnum.RECHAZADO;
    documento.fechaActualizacion = new Date();
    
    if (cambiarEstadoDto.motivoCambio) {
      documento.motivoCambio = cambiarEstadoDto.motivoCambio;
      documento.fechaCambio = new Date();
    }

    const documentoRechazado = await documento.save();

    // Enviar notificación de rechazo
    await this.sendStatusChangeNotification(documentoRechazado, 'rechazado', cambiarEstadoDto);

    return documentoRechazado;
  }

  /**
   * Cambiar estado del documento (genérico)
   */
  async changeDocumentStatus(cambiarEstadoDto: CambiarEstadoDto): Promise<IListadoMaestro> {
    const documento = await this.findOne(cambiarEstadoDto.documentoId);

    documento.estado = cambiarEstadoDto.nuevoEstado;
    documento.fechaActualizacion = new Date();
    
    if (cambiarEstadoDto.motivoCambio) {
      documento.motivoCambio = cambiarEstadoDto.motivoCambio;
      documento.fechaCambio = new Date();
    }

    const documentoActualizado = await documento.save();

    // Enviar notificación si es necesario
    if ([EstadoDocumentoEnum.APROBADO, EstadoDocumentoEnum.RECHAZADO].includes(cambiarEstadoDto.nuevoEstado)) {
      const accion = cambiarEstadoDto.nuevoEstado === EstadoDocumentoEnum.APROBADO ? 'aprobado' : 'rechazado';
      await this.sendStatusChangeNotification(documentoActualizado, accion, cambiarEstadoDto);
    }

    return documentoActualizado;
  }

  /**
   * Obtener documentos por estado
   */
  async findByStatus(estado: EstadoDocumentoEnum): Promise<IListadoMaestro[]> {
    return await this.listadoMaestroModel
      .find({ estado, activo: true })
      .populate('formatoId')
      .populate('propuestasPendientes')
      .sort({ fechaCreacion: -1 })
      .exec();
  }

  /**
   * Obtener estadísticas del listado maestro
   */
  async getStats(): Promise<{
    total: number;
    porEstado: { estado: string; cantidad: number }[];
    porProceso: { proceso: string; cantidad: number }[];
    porTipo: { tipo: string; cantidad: number }[];
  }> {
    const [estatsPorEstado, estatsPorProceso, estatsPorTipo, total] = await Promise.all([
      this.listadoMaestroModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$estado', cantidad: { $sum: 1 } } }
      ]),
      this.listadoMaestroModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$proceso', cantidad: { $sum: 1 } } }
      ]),
      this.listadoMaestroModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$tipoDocumento', cantidad: { $sum: 1 } } }
      ]),
      this.listadoMaestroModel.countDocuments({ activo: true })
    ]);

    return {
      total,
      porEstado: estatsPorEstado.map(e => ({ estado: e._id, cantidad: e.cantidad })),
      porProceso: estatsPorProceso.map(p => ({ proceso: p._id, cantidad: p.cantidad })),
      porTipo: estatsPorTipo.map(t => ({ tipo: t._id, cantidad: t.cantidad }))
    };
  }

  /**
   * Exportar a Excel
   */
  async exportToExcel(exportDto: ExportarExcelDto, res: Response): Promise<void> {
    // Construir filtros
    const filtros = exportDto.filtros || {};
    if (!exportDto.incluirInactivos) {
      filtros.activo = true;
    }

    const documentos = await this.findAll(filtros);

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Listado Maestro');

    // Definir columnas
    const columnas = [
      { header: 'Código', key: 'codigo', width: 15 },
      { header: 'Nombre del Documento', key: 'nombre', width: 40 },
      { header: 'Proceso', key: 'proceso', width: 20 },
      { header: 'Tipo de Documento', key: 'tipoDocumento', width: 20 },
      { header: 'Versión', key: 'version', width: 10 },
      { header: 'Fecha Creación', key: 'fechaCreacion', width: 15 },
      { header: 'Responsable', key: 'responsable', width: 25 },
      { header: 'Estado', key: 'estado', width: 20 },
      { header: 'Ubicación Física', key: 'ubicacionFisica', width: 30 },
      { header: 'Ubicación Magnética', key: 'ubicacionMagnetica', width: 30 },
      { header: 'Tiempo Retención Central', key: 'tiempoRetencionCentral', width: 20 },
      { header: 'Tiempo Retención Gestión', key: 'tiempoRetencionGestion', width: 20 },
      { header: 'Tiempo Retención Total', key: 'tiempoRetencionTotal', width: 20 },
      { header: 'Vigencia', key: 'vigencia', width: 15 },
      { header: 'Observaciones', key: 'observaciones', width: 40 }
    ];

    worksheet.columns = columnas;

    // Estilo del header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9d9101' }
    };

    // Agregar datos
    documentos.forEach(doc => {
      worksheet.addRow({
        codigo: doc.codigo,
        nombre: doc.nombre,
        proceso: doc.proceso,
        tipoDocumento: doc.tipoDocumento,
        version: doc.version,
        fechaCreacion: doc.fechaCreacion.toLocaleDateString(),
        responsable: doc.responsable,
        estado: doc.estado,
        ubicacionFisica: doc.ubicacionFisica || '',
        ubicacionMagnetica: doc.ubicacionMagnetica || '',
        tiempoRetencionCentral: doc.tiempoRetencion?.central || '',
        tiempoRetencionGestion: doc.tiempoRetencion?.gestion || '',
        tiempoRetencionTotal: doc.tiempoRetencion?.total || '',
        vigencia: doc.vigencia || '',
        observaciones: doc.observaciones || ''
      });
    });

    // Configurar respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=listado-maestro-${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Vincular documento del listado maestro con formato existente
   */
  async linkWithFormato(documentoId: string, formatoId: string): Promise<IListadoMaestro> {
    const [documento, formato] = await Promise.all([
      this.findOne(documentoId),
      this.formatoModel.findById(formatoId)
    ]);

    if (!formato) {
      throw new NotFoundException('Formato no encontrado');
    }

    documento.formatoId = new Types.ObjectId(formatoId);
    return await documento.save();
  }

  /**
   * Desvincular documento del formato
   */
  async unlinkFromFormato(documentoId: string): Promise<IListadoMaestro> {
    const documento = await this.findOne(documentoId);
    documento.formatoId = undefined;
    return await documento.save();
  }

  /**
   * Eliminar documento (soft delete)
   */
  async deleteDocument(id: string): Promise<IListadoMaestro> {
    const documento = await this.findOne(id);
    documento.activo = false;
    documento.fechaActualizacion = new Date();
    return await documento.save();
  }

  /**
   * Restaurar documento eliminado
   */
  async restoreDocument(id: string): Promise<IListadoMaestro> {
    const documento = await this.listadoMaestroModel.findById(id).exec();
    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }
    
    documento.activo = true;
    documento.fechaActualizacion = new Date();
    return await documento.save();
  }

  // Métodos privados para notificaciones por email

  private async sendApprovalRequestNotification(documento: IListadoMaestro): Promise<void> {
    if (!this.transporter) {
      console.warn('⚠️ Transporter de email no configurado');
      return;
    }

    try {
      const recipientMails = this.adminUsers.map(user => user.mail);

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: recipientMails.join(', '),
        subject: `📋 Nuevo documento pendiente de aprobación: ${documento.nombre}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #9d9101;">Nuevo Documento Pendiente de Aprobación</h2>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #856404;">Detalles del Documento:</h3>
              <p><strong>Código:</strong> ${documento.codigo}</p>
              <p><strong>Nombre:</strong> ${documento.nombre}</p>
              <p><strong>Proceso:</strong> ${documento.proceso}</p>
              <p><strong>Tipo:</strong> ${documento.tipoDocumento}</p>
              <p><strong>Versión:</strong> ${documento.version}</p>
              <p><strong>Responsable:</strong> ${documento.responsable}</p>
            </div>

            <div style="margin: 30px 0; padding: 20px; background-color: #e7f3ff; border-radius: 8px;">
              <h4 style="margin-top: 0; color: #004085;">Acciones Requeridas:</h4>
              <p>Este documento necesita aprobación para ser incluido oficialmente en el Listado Maestro.</p>
              <p>Por favor, revise el documento e ingrese al sistema para aprobar o rechazar.</p>
            </div>

            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px; text-align: center;">
              Sistema de Gestión Integral - SIG<br>
              Este es un mensaje automático, por favor no responder.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Notificación de aprobación enviada exitosamente');
    } catch (error) {
      console.error('❌ Error al enviar notificación:', error);
    }
  }

  private async sendStatusChangeNotification(
    documento: IListadoMaestro, 
    accion: string, 
    cambiarEstadoDto: CambiarEstadoDto
  ): Promise<void> {
    if (!this.transporter) {
      console.warn('⚠️ Transporter de email no configurado');
      return;
    }

    try {
      const recipientMails = this.adminUsers.map(user => user.mail);
      const isApproved = accion === 'aprobado';
      const color = isApproved ? '#28a745' : '#dc3545';
      const bgColor = isApproved ? '#d4edda' : '#f8d7da';
      const emoji = isApproved ? '✅' : '❌';

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: recipientMails.join(', '),
        subject: `${emoji} Documento ${accion}: ${documento.nombre}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${color};">Documento ${accion.charAt(0).toUpperCase() + accion.slice(1)}</h2>
            
            <div style="background-color: ${bgColor}; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Resultado de la Revisión</h3>
              <p><strong>Código:</strong> ${documento.codigo}</p>
              <p><strong>Nombre:</strong> ${documento.nombre}</p>
              <p><strong>Estado:</strong> ${accion.toUpperCase()}</p>
              <p><strong>Revisado por:</strong> ${cambiarEstadoDto.usuarioRevisa || 'Administrador'}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            ${cambiarEstadoDto.comentarios ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4>Comentarios:</h4>
                <p>${cambiarEstadoDto.comentarios}</p>
              </div>
            ` : ''}

            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px; text-align: center;">
              Sistema de Gestión Integral - SIG
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Notificación de ${accion} enviada exitosamente`);
    } catch (error) {
      console.error(`❌ Error al enviar notificación de ${accion}:`, error);
    }
  }
}