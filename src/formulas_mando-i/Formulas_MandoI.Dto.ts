import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsArray, IsOptional, ValidateNested } from 'class-validator';

export class VariableFormulaDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    identificador: string; // Por ejemplo: "IT" para ingresos totales

    @IsString()
    @IsNotEmpty()
    descripcion: string;

    @IsString()
    @IsOptional()
    unidadMedida?: string;
}

// DTO principal de la fórmula
export class Formula_MandoIDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    descripcion: string;

    @IsString()
    @IsNotEmpty()
    expresionMatematica: string; // Ejemplo: "(IT - GT) / RPA"

    @IsString()
    @IsNotEmpty()
    expresionLegible: string; // Ejemplo: "(ingresos totales - gastos totales) / rentabilidad periodo anterior"

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariableFormulaDto)
    variables: VariableFormulaDto[];

    @IsString()
    @IsOptional()
    unidadMedidaResultado?: string;

    @IsString()
    @IsOptional()
    observaciones?: string;
}