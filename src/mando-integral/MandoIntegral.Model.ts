import { Schema, Document } from 'mongoose';
import { IFormula_MandoI } from 'src/formulas_mando-i/Formulas_MandoI.model';

export const MandoIntegralSchema = new Schema({
    iniciativaEstrategica: { type: String, required: true },
    objetivo: { type: String, required: true },
    perspectiva: { type: String, required: true },
    tipoIndicador: { type: String, required: true },
    nombreIndicador: { type: String, required: true },
    formulaId: { type: Schema.Types.ObjectId, ref: 'Formula', required: true },
    ProcesoFuenteInformacion: { type: String, required: true },
    responsable: { type: String, required: true }, // Luego será ObjectId ref: 'Usuario'
    frecuenciaMedicion: { type: String, required: true },
    definicionInterpretacion: { type: String, required: true },
    meta: { type: String, required: true },
    aQuienSeDivulga: { type: String, required: true },
    medida: { type: String, required: true },
});

export interface IMandoIntegral extends Document {
    iniciativaEstrategica: string;
    objetivo: string;
    perspectiva: string;
    tipoIndicador: string;
    nombreIndicador: string;
    formula: IFormula_MandoI;
    ProcesoFuenteInformacion: string;
    responsable: string;
    frecuenciaMedicion: string;
    definicionInterpretacion: string;
    meta: string;
    aQuienSeDivulga: string;
    medida: string
}