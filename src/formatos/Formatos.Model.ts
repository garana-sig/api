import mongoose from 'mongoose';

export const FormatosSchema = new mongoose.Schema({
  proceso: String,
  codigo: String,
  nombre: String,
  tipo: String,
  vigencia: String,
  version: String,
  archivo: {
    nombre: String,
    extension: String,
    url: String,  // ID de GridFS como URL
    peso: Number,
  },
  listadoMaestroId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ListadoMaestro'
  }
});

export interface IFormatos extends mongoose.Document {
  proceso: string;
  codigo: string;
  nombre: string;
  tipo: 'formato' | 'plantilla';
  vigencia: string;
  version: string;
  archivo: {
    nombre: string;
    extension: string;
    url: string;
    peso: number;
  };
  listadoMaestroId?: mongoose.Types.ObjectId;
}
