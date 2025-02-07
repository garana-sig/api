import mongoose, { Schema } from "mongoose";
import { Accion, Origen } from "./AccionesMejora.Dto";

export const AccionesMejoraSchema = new Schema({
    consecutivo: { type: String, required: true },
    fecha: { type: Date, required: true },
    proceso: { type: String, required: true },
    origen: { type: String, enum: Object.values(Origen), required: true },
    descripcion_hallazgo: { type: String, required: true },
    accion: { type: String, enum: Object.values(Accion), required: true },
    causas: { type: String, required: true },
    descripcion_acciones: { type: String, required: true },
    logros_esperados: { type: String, required: true },
    recursos_presupuesto: { type: String, required: true },
    responsable: { type: String, required: true },
    fecha_propuesta: { type: Date, required: true },
    criterios_verificacion: { type: String, required: true },
    hallazgo_verificacion: { type: String, required: true },
    fecha_verificacion: { type: Date, required: true },
    fecha_eficacia: { type: Date, required: true },
    cierre_si: { type: String, required: true },
    cierre_no: { type: String, required: true },
    auditor: { type: String },
    observaciones: { type: String, required: true },
  
});

export interface IAccionesMejora extends Document {
    consecutivo: string;
    fecha: Date;
    proceso: string;
    origen: Origen;
    descripcion_hallazgo: string;
    accion: Accion;
    causas: string;
    descripcion_acciones: string;
    logros_esperados: string;
    recursos_presupuesto: string;
    responsable: string;
    fecha_propuesta: Date;
    criterios_verificacion: string;
    hallazgo_verificacion: string;
    fecha_verificacion: Date;
    fecha_eficacia: Date;
    cierre_si: string;
    cierre_no: string;
    auditor: string;
    observaciones: string;
   
}