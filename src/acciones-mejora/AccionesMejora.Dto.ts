import { IsDate, IsEnum, IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import mongoose, { Schema, Document } from "mongoose";

export enum Origen {
    AUDITORIA = 'auditoria',
    QRS = 'qrs',
    SATISFACCION = 'satisfaccion',
    AUTOCONTROL = 'autocontrol',
    ANALISIS_RIESGOS = 'analisis_riesgos',
    PROD_NO_CONFORME = 'prod_no_conforme'
}

export enum Accion {
    CORRECION = 'correccion',
    CORRECTIVA = 'correctiva',
    PREVENTIVA = 'preventiva'
}

export class AccionesMejoraDto {
    @IsString()
    @IsNotEmpty()
    consecutivo: string;

    @IsDate()
    @Type(() => Date)
    fecha: Date;

    @IsString()
    @IsNotEmpty()
    proceso: string;

    @IsEnum(Origen)
    origen: Origen;

    @IsString()
    @IsNotEmpty()
    descripcion_hallazgo: string;

    @IsEnum(Accion)
    accion: Accion;

    @IsString()
    @IsNotEmpty()
    causas: string;

    @IsString()
    @IsNotEmpty()
    descripcion_acciones: string;

    @IsString()
    @IsNotEmpty()
    logros_esperados: string;

    @IsString()
    @IsNotEmpty()
    recursos_presupuesto: string;

    @IsString()
    @IsNotEmpty()
    responsable: string;

    @IsDate()
    @Type(() => Date)
    fecha_propuesta: Date;

    @IsString()
    @IsNotEmpty()
    criterios_verificacion: string;

    @IsString()
    @IsNotEmpty()
    hallazgo_verificacion: string;

    @IsDate()
    @Type(() => Date)
    fecha_verificacion: Date;

    @IsDate()
    @Type(() => Date)
    fecha_eficacia: Date;

    @IsString()
    @IsNotEmpty()
    cierre_si: string;

    @IsString()
    @IsNotEmpty()
    cierre_no: string;

    @IsString()
    @IsNotEmpty()
    auditor: string;

    @IsString()
    @IsOptional()
    observaciones: string;

  
}