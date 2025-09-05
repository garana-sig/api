import mongoose from 'mongoose';
import { IFormatos } from '../formatos/Formatos.Model';

export const PropuestaSchema = new mongoose.Schema({
  formatoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formatos',
    required: true,
  },
  propuesta: {
    nombre: {
      type: String,
    },
    vigencia: {
      type: String,
    },
    version: {
      type: String,
      required: true,
    },
    // ¡NUEVO! Campo para el archivo modificado
    archivo: {
      nombre: String,
      extension: String,
      url: String,  // ID de GridFS del archivo propuesto
      peso: Number,
    },
  },
  motivoCambio: {
    type: String,
    required: true,
  },
  fechaPropuesta: {
    type: Date,
    default: Date.now,
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente',
  },
  // ¡NUEVO! Campos adicionales para tracking
  usuarioPropone: {
    type: String,
     // Puedes agregar autenticación después
  },
  fechaRevision: {
    type: Date,
    
  },
  usuarioRevisa: {
    type: String,
    
  },
  comentariosRevision: {
    type: String,
   
  },

  listadoMaestroUpdated: {
    type: Boolean,
    default: false,
  }
});

export interface IPropuesta extends mongoose.Document {
  formatoId: mongoose.Types.ObjectId | IFormatos;
  propuesta: {
    nombre?: string;
    vigencia?: string;
    version: string;
    // ¡NUEVO! Archivo propuesto
    archivo?: {
      nombre: string;
      extension: string;
      url: string;
      peso: number;
    };
  };
  motivoCambio: string;
  fechaPropuesta: Date;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  // ¡NUEVOS! Campos de tracking
  usuarioPropone?: string;
  fechaRevision?: Date;
  usuarioRevisa?: string;
  comentariosRevision?: string;
  listadoMaestroUpdated?: boolean;
}