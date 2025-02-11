import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { IAccionesMejora } from './AccionesMejora.Model';
import { AccionesMejoraDto } from './AccionesMejora.Dto';
import { PlantillasService } from 'src/plantillas/plantillas.service';
import * as sgMail from '@sendgrid/mail';
import 'dotenv/config';
import * as dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';

dotenv.config();

const SENDMAIL = process.env.API_KEY;


    
@Injectable()
export class AccionesMejoraService {

  private transporter: nodemailer.Transporter;
  private readonly PRIMERA_FILA_DATOS = 9;
  private readonly users = [
    { nombre: 'Margarita Ramirez', mail: 'margaritaramirez1314@gmail.com',},
    {nombre: 'Diana Marin', mail: 'dipamato@gmail.com',},
    {nombre: 'Ana Ospina', mail: 'anaisabelospina9@gmail.com',},
  ];


constructor(
    @InjectModel('AccionesMejora')
    private accionesMejoraModel: Model<IAccionesMejora>,
    private plantillaService: PlantillasService,

  ) {  this.transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD  // Contraseña de aplicación
    }
  })}
// Método para enviar el correo
async enviarCorreo(accionMejora: AccionesMejoraDto) {
  try {
    const usuario = this.users.find((u) => u.nombre === accionMejora.responsable);
    
    if (!usuario?.mail) {
      console.warn(`No se encontró correo para ${accionMejora.responsable}`);
      return;
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: usuario.mail,
      subject: 'Nueva Acción de Mejora Asignada',
      text: `
        Buen día ${accionMejora.responsable},

        Se le ha asignado una nueva Acción de Mejora:

        Descripción: ${accionMejora.descripcion_hallazgo}
        Proceso: ${accionMejora.proceso}
        Fecha Propuesta: ${accionMejora.fecha_propuesta}

        Por favor, revise los detalles y proceda con su implementación.

        Saludos cordiales,
        
        Sistema de Gestión Integrado -  Acciones de Mejora
      `
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`Correo enviado exitosamente a ${accionMejora.responsable}`);
  } catch (error) {
    console.error('Error al enviar correo:', error);
    throw new Error(`Fallo al enviar correo: ${error.message}`);
  }
}



  async create(accionesMejoraDto: AccionesMejoraDto) {
    const nuevaAccion = new this.accionesMejoraModel({
      ...accionesMejoraDto,
    });

    const savedAccion = await nuevaAccion.save();

    // Enviar correo al responsable
    this.enviarCorreo(savedAccion)

    return savedAccion;
  }

  async downloadFormato(): Promise<{ buffer: Buffer; filename: string }> {
    const plantilla = await this.plantillaService.obtenerPlantillaActiva();
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(plantilla.buffer);
    const worksheet = workbook.getWorksheet('v3');
    if (!worksheet) {
      throw new NotFoundException('Hoja de trabajo no encontrada');
    }

    // Obtener todos los registros ordenados por fecha
    const registros = await this.accionesMejoraModel.find().sort({ fecha: 1 });

    let accioncorrecion = '';
    let accioncorrectiva = '';
    let accionpreventiva = '';
    let origena = '';
    let origenauto = '';
    let origenq = '';
    let origensatis = '';
    let origenana = '';
    let origenprod = '';
    let observaciones = '';

    let currentRow = this.PRIMERA_FILA_DATOS;
    registros.forEach((registro) => {
      /** Logica para origen  */
      switch (registro.origen) {
        case 'auditoria':
          origena = 'X';
          break;
        case 'qrs':
          origenq = 'X';
          break;
        case 'satisfaccion':
          origensatis = 'X';
          break;
        case 'autocontrol':
          origenauto = 'X';
          break;
        case 'analisis_riesgos':
          origenana = 'X';
          break;
        case 'prod_no_conforme':
          origenprod = 'X';
          break;
        default:
          break;
      }

      /** Loggica para accion */

      switch (registro.accion) {
        case 'correccion':
          accioncorrecion = 'X';
          break;
        case 'correctiva':
          accioncorrectiva = 'X';
          break;
        case 'preventiva':
          accionpreventiva = 'X';
          break;

        default:
          break;
      }

      /** Logica para Observaciones */

      worksheet.getCell(`A${currentRow}`).value = registro.consecutivo;
      worksheet.getCell(`B${currentRow}`).value = registro.fecha;
      worksheet.getCell(`C${currentRow}`).value = registro.proceso;
      worksheet.getCell(`D${currentRow}`).value = origena;
      worksheet.getCell(`E${currentRow}`).value = origenq;
      worksheet.getCell(`F${currentRow}`).value = origensatis;
      worksheet.getCell(`G${currentRow}`).value = origenauto;
      worksheet.getCell(`H${currentRow}`).value = origenana;
      worksheet.getCell(`I${currentRow}`).value = origenprod;
      worksheet.getCell(`J${currentRow}`).value = registro.descripcion_hallazgo;
      worksheet.getCell(`K${currentRow}`).value = accioncorrecion;
      worksheet.getCell(`L${currentRow}`).value = accioncorrectiva;
      worksheet.getCell(`M${currentRow}`).value = accionpreventiva;
      worksheet.getCell(`N${currentRow}`).value = registro.causas;
      worksheet.getCell(`O${currentRow}`).value = registro.descripcion_acciones;
      worksheet.getCell(`P${currentRow}`).value = registro.logros_esperados;
      worksheet.getCell(`Q${currentRow}`).value = registro.recursos_presupuesto;
      worksheet.getCell(`R${currentRow}`).value = registro.responsable;
      worksheet.getCell(`S${currentRow}`).value = registro.fecha_propuesta;
      worksheet.getCell(`T${currentRow}`).value =
        registro.criterios_verificacion;
      worksheet.getCell(`U${currentRow}`).value =
        registro.hallazgo_verificacion;
      worksheet.getCell(`X${currentRow}`).value = registro.fecha_verificacion;
      worksheet.getCell(`Y${currentRow}`).value = registro.fecha_eficacia;
      worksheet.getCell(`Z${currentRow}`).value = registro.cierre_si;
      worksheet.getCell(`AA${currentRow}`).value = registro.cierre_no;
      worksheet.getCell(`AB${currentRow}`).value = registro.auditor;
      worksheet.getCell(`AC${currentRow}`).value = observaciones;
      // ... más campos
      currentRow++;
    });

    const newBuffer = await workbook.xlsx.writeBuffer();
    const filename = `acciones_mejora_${new Date().toISOString().split('T')[0]}.xlsx`;

    return {
      buffer: Buffer.from(newBuffer),
      filename,
    };
  }
}
