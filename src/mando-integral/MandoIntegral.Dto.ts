import { IsString, IsNotEmpty, IsOptional, ValidateNested, IsMongoId } from 'class-validator';
import { IFormula_MandoI } from 'src/formulas_mando-i/Formulas_MandoI.model';


export class MandoIntegralDto {
    @IsString()
    @IsNotEmpty()
    iniciativaEstrategica: string;

    @IsString()
    @IsNotEmpty()
    objetivo: string;

    @IsString()
    @IsNotEmpty()
    perspectiva: string;

    @IsString()
    @IsNotEmpty()
    tipoIndicador: string;

    @IsString()
    @IsNotEmpty()
    nombreIndicador: string;

    @IsMongoId()
    formula: IFormula_MandoI; // Referencia a la fórmula

    @IsString()
    @IsNotEmpty()
    ProcesoFuenteInformacion: string;

    @IsString()
    @IsNotEmpty()
    responsable: string; // Por ahora string, luego será ObjectId de Usuario

    @IsString()
    @IsNotEmpty()
    frecuenciaMedicion: string;

    @IsString()
    @IsNotEmpty()
    definicionInterpretacion: string;

    @IsString()
    @IsNotEmpty()
    meta: string;

    @IsString()
    @IsNotEmpty()
    aQuienSeDivulga: string;

    @IsString()
    medida: string
}
