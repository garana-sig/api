import { Schema, Document } from 'mongoose';

const VariableFormulaSchema = new Schema({
    nombre: { type: String, required: true },
    identificador: { type: String, required: true },
    descripcion: { type: String, required: true },
    unidadMedida: { type: String }
});

export const Formula_MandoISchema = new Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    expresionMatematica: { type: String, required: true },
    expresionLegible: { type: String, required: true },
    variables: [VariableFormulaSchema],
    unidadMedidaResultado: { type: String },
    observaciones: { type: String }
});

// Interfaces
export interface IVariableFormula {
    nombre: string;
    identificador: string;
    descripcion: string;
    unidadMedida?: string;
}

export interface IFormula_MandoI extends Document {
    nombre: string;
    descripcion: string;
    expresionMatematica: string;
    expresionLegible: string;
    variables: IVariableFormula[];
    unidadMedidaResultado?: string;
    observaciones?: string;
}