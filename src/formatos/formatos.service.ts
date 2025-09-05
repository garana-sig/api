import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { GridFsService } from 'src/gridfs/gridfs.service';
import { FormatosDto } from './FormatosDto';
import { IFormatos } from './Formatos.Model';
import { IPropuesta } from '../Propuestas/PropuestasModel';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PropuestaDto, RevisionPropuestaDto } from '../Propuestas/PropuestasDto';
import * as nodemailer from 'nodemailer';
import 'dotenv/config';
import { IListadoMaestro } from 'src/listado-maestro/ListadoMaestro.Model';

@Injectable()
export class FormatosService {
  private transporter: nodemailer.Transporter; // ¡ACTUALIZADO! Puede ser null
  private readonly users = [
    { nombre: 'Margarita Ramirez', mail: 'margaritaramirez1314@gmail.com',},
    {nombre: 'Diana Marin', mail: 'dipamato@gmail.com',},
    {nombre: 'Ana Ospina', mail: 'anaisabelospina9@gmail.com',},
  ];

  constructor(
    @InjectModel('Formatos') private formatoModel: Model<IFormatos>,
    @InjectModel('Propuestas') private propuestaModel: Model<IPropuesta>,
    @InjectModel('ListadoMaestro') private listadoMaestroModel: Model<IListadoMaestro>,
    private readonly gridfsService: GridFsService,
  ){  this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD  // Contraseña de aplicación
      }
    })}

  async createFile(formatoDto: FormatosDto, file: Express.Multer.File): Promise<IFormatos> {
    if (file) {
      const fileData = await this.gridfsService.uploadFile(file);
      formatoDto.archivo = {
        nombre: file.originalname,
        extension: file.mimetype,
        url: fileData.fileId.toString(),
        peso: file.size,
      };
    }
    const fileCreated = new this.formatoModel(formatoDto);
    /** cambio  */
    // Crear automáticamente registro en listado maestro
    try {
      const listadoRegistro = new this.listadoMaestroModel({
        codigo: formatoDto.codigo,
        nombre: formatoDto.nombre,
        proceso: formatoDto.proceso,
        tipoDocumento: formatoDto.tipo === 'formato' ? 'registro' : formatoDto.tipo,
        version: formatoDto.version,
        fechaCreacion: new Date(),
        responsable: 'Por definir',
        estado: 'aprobado',
        vigencia: formatoDto.vigencia,
        activo: true
      });
      
      const savedListado = await listadoRegistro.save();
      fileCreated.listadoMaestroId = savedListado._id as Types.ObjectId;
      await fileCreated.save();
      
      console.log('Registro creado automáticamente en listado maestro:', savedListado.codigo);
    } catch (error) {
      console.warn('Error al crear registro en listado maestro:', error);
    }
    return await fileCreated.save();
  }

  // ¡ACTUALIZADO! Método para crear propuestas CON archivo modificado
  async proposeUpdate(
    id: string, 
    propuestaDto: PropuestaDto, 
    archivoModificado?: Express.Multer.File
  ): Promise<IPropuesta> {
    const existingFile = await this.formatoModel.findById(id).exec();
    if (!existingFile) {
      throw new NotFoundException('Archivo no encontrado para proponer actualización.');
    }

    const newVersion = this.incrementVersion(existingFile.version);

    // Crear la estructura de la propuesta
    const propuestaData: any = {
      formatoId: existingFile._id,
      propuesta: {
        version: newVersion,
      },
      motivoCambio: propuestaDto.motivoCambio,
      fechaPropuesta: new Date(),
      usuarioPropone: propuestaDto.usuarioPropone || 'Usuario Anónimo',
    };

    // Solo agregar campos que cambiaron
    if (propuestaDto.nombre && propuestaDto.nombre !== existingFile.nombre) {
      propuestaData.propuesta.nombre = propuestaDto.nombre;
    }

    if (propuestaDto.vigencia && propuestaDto.vigencia !== existingFile.vigencia) {
      propuestaData.propuesta.vigencia = propuestaDto.vigencia;
    }

    // ¡NUEVO! Si hay archivo modificado, subirlo a GridFS
    if (archivoModificado) {
      try {
        const fileData = await this.gridfsService.uploadFile(archivoModificado);
        propuestaData.propuesta.archivo = {
          nombre: archivoModificado.originalname,
          extension: archivoModificado.mimetype,
          url: fileData.fileId.toString(),
          peso: archivoModificado.size,
        };
        console.log('Archivo modificado subido a GridFS:', fileData.fileId);
      } catch (error) {
        console.error('Error al subir archivo modificado:', error);
        throw new BadRequestException('Error al procesar el archivo modificado');
      }
    }

    const newProposal = new this.propuestaModel(propuestaData);
    const savedProposal = await newProposal.save();
    
    // ¡ACTUALIZADO! Enviar email con archivo adjunto si existe
    await this.sendEmailForProposal(
      savedProposal, 
      existingFile.codigo, 
      existingFile.nombre,
      archivoModificado // Pasar el archivo para adjuntarlo
    );
    
    return savedProposal;
  }

  // ¡ACTUALIZADO! Método para aprobar propuestas con manejo de archivos
  async approveProposal(propuestaId: string, revisionDto?: RevisionPropuestaDto): Promise<IFormatos> {
    const propuesta = await this.propuestaModel.findById(propuestaId).exec();
    if (!propuesta || propuesta.estado !== 'pendiente') {
      throw new NotFoundException('Propuesta no encontrada o ya procesada.');
    }

    const formatoOriginal = await this.formatoModel.findById(propuesta.formatoId).exec();
    if (!formatoOriginal) {
      throw new NotFoundException('Formato original no encontrado.');
    }

    // Actualizar metadatos si cambiaron
    if (propuesta.propuesta.nombre) {
      formatoOriginal.nombre = propuesta.propuesta.nombre;
    }
    if (propuesta.propuesta.vigencia) {
      formatoOriginal.vigencia = propuesta.propuesta.vigencia;
    }
    
    // Actualizar versión siempre
    formatoOriginal.version = propuesta.propuesta.version;

    // ¡NUEVO! Si hay archivo modificado en la propuesta, reemplazar el original
    if (propuesta.propuesta.archivo) {
      // Opcional: Eliminar el archivo anterior de GridFS para ahorrar espacio
      // await this.gridfsService.deleteFile(formatoOriginal.archivo.url);
      
      // Reemplazar con el nuevo archivo
      formatoOriginal.archivo = {
        nombre: propuesta.propuesta.archivo.nombre,
        extension: propuesta.propuesta.archivo.extension,
        url: propuesta.propuesta.archivo.url,
        peso: propuesta.propuesta.archivo.peso,
      };
      console.log('Archivo original reemplazado por archivo de propuesta');
    }

    // Guardar formato actualizado
    const updatedFormato = await formatoOriginal.save();
    
    // Actualizar estado de la propuesta
    propuesta.estado = 'aprobada';
    propuesta.fechaRevision = new Date();
    propuesta.usuarioRevisa = revisionDto?.usuarioRevisa || 'Administrador';
    propuesta.comentariosRevision = revisionDto?.comentarios;
    await propuesta.save();

    // ¡NUEVO! Enviar notificación de aprobación
    await this.sendApprovalNotification(propuesta, formatoOriginal, 'aprobada');
    /** NUEVOOOO  */
    // Actualizar listado maestro si el formato está vinculado
    if (formatoOriginal.listadoMaestroId) {
      try {
        await this.updateListadoMaestroFromFormat(formatoOriginal);
        console.log('Listado maestro actualizado para formato:', formatoOriginal.codigo);
      } catch (error) {
        console.warn('Error al actualizar listado maestro:', error);
      }
    }
    return updatedFormato;
  }

  // ¡ACTUALIZADO! Método para rechazar propuestas con comentarios
  async rejectProposal(propuestaId: string, revisionDto?: RevisionPropuestaDto): Promise<IPropuesta> {
    const propuesta = await this.propuestaModel.findById(propuestaId).exec();
    if (!propuesta || propuesta.estado !== 'pendiente') {
      throw new NotFoundException('Propuesta no encontrada o ya procesada.');
    }

    propuesta.estado = 'rechazada';
    propuesta.fechaRevision = new Date();
    propuesta.usuarioRevisa = revisionDto?.usuarioRevisa || 'Administrador';
    propuesta.comentariosRevision = revisionDto?.comentarios;
    
    const rejectedProposal = await propuesta.save();

    // ¡NUEVO! Si había archivo en la propuesta, eliminarlo de GridFS
    if (propuesta.propuesta.archivo) {
      try {
        await this.gridfsService.deleteFile(propuesta.propuesta.archivo.url);
        console.log('Archivo de propuesta rechazada eliminado de GridFS');
      } catch (error) {
        console.error('Error al eliminar archivo de propuesta rechazada:', error);
      }
    }

    // ¡NUEVO! Enviar notificación de rechazo
    const formatoOriginal = await this.formatoModel.findById(propuesta.formatoId).exec();
    if (!formatoOriginal) {
      throw new NotFoundException('Formato original no encontrado para notificación');
    }
    await this.sendApprovalNotification(rejectedProposal, formatoOriginal, 'rechazada');
    
    return rejectedProposal;
  }

  // ¡NUEVO! Método para descargar archivo de propuesta
  async downloadProposalFile(propuestaId: string, res: Response) {
    const propuesta = await this.propuestaModel.findById(propuestaId).exec();
    if (!propuesta || !propuesta.propuesta.archivo) {
      throw new NotFoundException('Propuesta o archivo no encontrado');
    }
    
    const fileInfo = await this.gridfsService.getFileById(propuesta.propuesta.archivo.url, res);
    if (!fileInfo) {
      throw new NotFoundException('Archivo no encontrado en GridFS');
    }
  }

  // ¡NUEVO! Método para obtener detalles completos de una propuesta
  async getProposalDetails(propuestaId: string): Promise<IPropuesta> {
    const propuesta = await this.propuestaModel
      .findById(propuestaId)
      .populate('formatoId')
      .exec();
    
    if (!propuesta) {
      throw new NotFoundException('Propuesta no encontrada');
    }
    
    return propuesta;
  }
  
  async findOne(id: string): Promise<IFormatos> {
    const formato = await this.formatoModel.findById(id).exec();
    if (!formato) {
      throw new NotFoundException('Formato no encontrado');
    }
    return formato;
  }

  async downloadFile(id: string, res: Response) {
    const fileInfo = await this.gridfsService.getFileById(id, res);
    if (!fileInfo) {
      throw new NotFoundException('Archivo no encontrado');
    }
  }

  async findAll(): Promise<IFormatos[]> {
    return await this.formatoModel.find().exec();
  }

  async findAllPendingProposals(): Promise<IPropuesta[]> {
    return await this.propuestaModel.find({ estado: 'pendiente' }).populate('formatoId').exec();
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    if (parts.length > 1) {
        let major = parseInt(parts[0], 10);
        let minor = parseInt(parts[1], 10);
        minor++;
        return `${major}.${minor}`;
    }
    const versionNumber = parseInt(currentVersion, 10);
    return (versionNumber + 1).toString();
  }

  // ¡ACTUALIZADO! Método para enviar correos CON archivo adjunto
  private async sendEmailForProposal(
    propuesta: IPropuesta, 
    formatoCodigo: string,
    formatoNombre: string,
    archivoModificado?: Express.Multer.File
  ) {
    // ¡NUEVO! Verificar si el transporter está configurado
    if (!this.transporter) {
      console.warn('⚠️  Transporter de email no configurado. Email no enviado.');
      console.warn('   Configura GMAIL_USER y GMAIL_PASSWORD en .env para habilitar emails');
      return;
    }

    try {
      const recipientMails = this.users.map(user => user.mail);

      const mailOptions: any = {
        from: process.env.GMAIL_USER,
        to: recipientMails.join(', '), // Enviar a todos los usuarios
        subject: `🔄 Nueva propuesta de modificación: ${formatoNombre}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Nueva Propuesta de Modificación</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #495057;">Detalles del Formato:</h3>
              <p><strong>Código:</strong> ${formatoCodigo}</p>
              <p><strong>Nombre:</strong> ${formatoNombre}</p>
              <p><strong>Nueva Versión Propuesta:</strong> ${propuesta.propuesta.version}</p>
              <p><strong>Usuario que Propone:</strong> ${propuesta.usuarioPropone || 'No especificado'}</p>
            </div>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <h4 style="margin-top: 0; color: #856404;">Motivo del Cambio:</h4>
              <p style="margin-bottom: 0;">${propuesta.motivoCambio}</p>
            </div>

            ${propuesta.propuesta.archivo ? `
              <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #0c5460;">📎 Archivo Modificado Adjunto</h4>
                <p>Se ha incluido el archivo modificado para su revisión.</p>
              </div>
            ` : ''}

            <div style="margin: 30px 0; padding: 20px; background-color: #e7f3ff; border-radius: 8px;">
              <h4 style="margin-top: 0; color: #004085;">Próximos Pasos:</h4>
              <ol style="margin-bottom: 0;">
                <li>Revisar los cambios propuestos</li>
                <li>Descargar y examinar el archivo modificado (si aplica)</li>
                <li>Ingresar al sistema para aprobar o rechazar la propuesta</li>
              </ol>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <strong>ID de la Propuesta:</strong> <code>${propuesta._id}</code>
            </p>

            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px; text-align: center;">
              Sistema de Gestión de Formatos - SIG<br>
              Este es un mensaje automático, por favor no responder a este correo.
            </p>
          </div>
        `
      };

      // ¡NUEVO! Adjuntar archivo modificado si existe
      if (archivoModificado && archivoModificado.buffer) {
        mailOptions.attachments = [{
          filename: archivoModificado.originalname,
          content: archivoModificado.buffer,
          contentType: archivoModificado.mimetype
        }];
      }

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Correo de propuesta enviado exitosamente a: ${recipientMails.join(', ')}`);
    } catch (error) {
      console.error('❌ Error al enviar correo de propuesta:', error);
      // No lanzar error para que no falle toda la operación por un problema de email
      console.warn('⚠️  La propuesta se creó correctamente pero falló el envío del email');
    }
  }

  // ¡NUEVO! Método para enviar notificaciones de aprobación/rechazo
  private async sendApprovalNotification(
    propuesta: IPropuesta,
    formato: IFormatos,
    decision: 'aprobada' | 'rechazada'
  ) {
    // ¡NUEVO! Verificar si el transporter está configurado
    if (!this.transporter) {
      console.warn('⚠️  Transporter de email no configurado. Notificación no enviada.');
      return;
    }

    try {
      const isApproved = decision === 'aprobada';
      const color = isApproved ? '#28a745' : '#dc3545';
      const bgColor = isApproved ? '#d4edda' : '#f8d7da';
      const emoji = isApproved ? '✅' : '❌';

      // Si hay un usuario que propuso, enviarle el resultado
      // Por ahora envío a todos, pero puedes filtrar por propuesta.usuarioPropone
      const recipientMails = this.users.map(user => user.mail);

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: recipientMails.join(', '),
        subject: `${emoji} Propuesta ${decision}: ${formato.nombre}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${color};">Propuesta ${decision.charAt(0).toUpperCase() + decision.slice(1)}</h2>
            
            <div style="background-color: ${bgColor}; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Resultado de la Revisión</h3>
              <p><strong>Formato:</strong> ${formato.nombre} (${formato.codigo})</p>
              <p><strong>Propuesta ID:</strong> ${propuesta._id}</p>
              <p><strong>Estado:</strong> ${decision.toUpperCase()}</p>
              <p><strong>Revisado por:</strong> ${propuesta.usuarioRevisa}</p>
              <p><strong>Fecha de Revisión:</strong> ${propuesta.fechaRevision?.toLocaleDateString()}</p>
            </div>

            ${propuesta.comentariosRevision ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4>Comentarios del Revisor:</h4>
                <p>${propuesta.comentariosRevision}</p>
              </div>
            ` : ''}

            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px; text-align: center;">
              Sistema de Gestión de Formatos - SIG
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Notificación de ${decision} enviada exitosamente`);
    } catch (error) {
      console.error(`❌ Error al enviar notificación de ${decision}:`, error);
      // No fallar la operación por problemas de email
    }
  }
  /**
   * Actualizar registro en listado maestro cuando se aprueba un cambio de formato
   */
  private async updateListadoMaestroFromFormat(formato: IFormatos): Promise<void> {
    const listadoRegistro = await this.listadoMaestroModel
      .findById(formato.listadoMaestroId)
      .exec();
      
    if (!listadoRegistro) {
      console.warn(`No se encontró registro en listado maestro para formato: ${formato.codigo}`);
      return;
    }

    listadoRegistro.nombre = formato.nombre;
    listadoRegistro.version = formato.version;
    listadoRegistro.vigencia = formato.vigencia;
    listadoRegistro.fechaActualizacion = new Date();
    listadoRegistro.estado = 'aprobado';
    
    await listadoRegistro.save();
  }
}