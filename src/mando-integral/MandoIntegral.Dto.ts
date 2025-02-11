import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Schema, Document } from 'mongoose';


//enum para la descripcion
export enum FormulaDescription {
    RENTABILIDAD = "rentabilidad",
    ROTACION_CARTERA="rotacion_cartera",
    AUMENTO_VENTAS='aumento_ventas',
    SATISFACCION_CLIENTES ='satisfaccion_clientes',
    PARTICIPACION_VENTAS_X_CLIENTE='participacion_ventas_x_cliente',
    EFICIENCIA ='eficiencia',
    PRODUCTO_NO_CONFORME = 'producto_no_conforme',
    DISMINUCION_TIEMPO_X_PARO_MAQUINA ='disminucion_tiempo_x_paro_maquina',
    DESPERDICIO='desperdicio',
    ACCIONES_MEJORA_IMPLEMENTADAS ='acciones_meh',
    EJECUCION_PLAN_DIRECCION='',
    CONFIABILIDAD_PROVEEDORES='',
    EJECUCION_PLAN_TRABAJO_SST='ejecucion_plan_trabajo_sst',
    NO_CONFORMIDADES_SISTEMA='no_confomidades_sistema',
    SATISFACCION_LABORAL='satisfaccion_laboral',
    NIVEL_COMPETENCIA_DESEMPEÑO='nivel_competencia_desempeño',
    EJECUCION_PLAN_CAPACITACION='ejecucion_plan_capacitacion',
    INDICE_ACCIDENTALIDAD='indice_accidentalidad',
    INDICE_AUSENTISMO='indice_ausentismo',
    INDICE_INCIDENTES='indice_incidentes',
}
// DTO para la fórmula
export class FormulaDto {
    @IsString()
    @IsNotEmpty()
    descripcion: string;

    @IsString()
    @IsNotEmpty()
    formula: string;

    @IsOptional()
    @IsString({ each: true })
    variables?: string[];
}

// DTO principal
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

    @ValidateNested()
    @Type(() => FormulaDto)
    comoSeMide: FormulaDto;

    @IsString()
    @IsNotEmpty()
    fuenteInformacion: string;

    // Por ahora lo dejamos como string, pero está preparado para ser referencia
    @IsString()
    @IsNotEmpty()
    responsable: string;

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
}