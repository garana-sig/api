import { Schema, Document } from 'mongoose';

export const MandoIntegralSchema = new Schema({
    iniciativaEstrategica: { type: String, required: true },
    objetivo: { type: String, required: true },
    perspectiva: { type: String, required: true },
    tipoIndicador: { type: String, required: true },
    nombreIndicador: { type: String, required: true },
    comoSeMide: {
        descripcion: { type: String, required: true },
        formula: { type: String, required: true },
        variables: [{ type: String }]
    },
    fuenteInformacion: { type: String, required: true },
    responsable: { type: String, required: true }, // Posteriormente será: { type: Schema.Types.ObjectId, ref: 'Usuario' }
    frecuenciaMedicion: { type: String, required: true },
    definicionInterpretacion: { type: String, required: true },
    meta: { type: String, required: true },
    aQuienSeDivulga: { type: String, required: true }
});

// Interfaz
export interface IMandoIntegral extends Document {
    iniciativaEstrategica: string;
    objetivo: string;
    perspectiva: string;
    tipoIndicador: string;
    nombreIndicador: string;
    comoSeMide: {
        descripcion: string;
        formula: string;
        variables?: string[];
    };
    fuenteInformacion: string;
    responsable: string; // Posteriormente será: Types.ObjectId | IUsuario;
    frecuenciaMedicion: string;
    definicionInterpretacion: string;
    meta: string;
    aQuienSeDivulga: string;
}