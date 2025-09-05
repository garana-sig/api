import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Types } from 'mongoose';

// Enums para validación
export enum ProcesoEnum {
  DIRECCION_Y_PLANEACION_ESTRATEGICA = 'DIRECCION Y PLANEACION ESTRATEGICA',
  GESTION_DE_LA_CALIDAD_Y_SST = 'GESTION DE LA CALIDAD Y SST',
  GESTION_DE_CLIENTES = 'GESTION DE CLIENTES',
  GESTION_DE_PRODUCCION = 'GESTION DE PRODUCCION',
  GESTIÓN_DE_TALENTO_HUMANO = 'GESTIÓN DE TALENTO HUMANO',
  GESTION_DE_PROVEEDORES = 'GESTION DE PROVEEDORES',
  GESTION_CONTABLE_Y_FINANCIERA = 'GESTION CONTABLE Y FINANCIERA'
}

export enum TipoDocumentoEnum {
  MANUAL = 'manual',
  PROCEDIMIENTO = 'procedimiento',
  REGISTRO = 'registro',
  INSTRUCTIVO = 'instructivo'
}

export enum EstadoDocumentoEnum {
  BORRADOR = 'borrador',
  PENDIENTE_APROBACION = 'pendiente_aprobacion',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  EN_REVISION = 'en_revision',
  OBSOLETO = 'obsoleto'
}

export enum SeleccionEnum {
  CONSERVAR = 'conservar',
  ELIMINAR = 'eliminar',
  MICROFILMAR = 'microfilmar'
}

export enum EliminacionEnum {
  PENDIENTE = 'pendiente',
  EJECUTADA = 'ejecutada',
  NO_APLICA = 'no_aplica'
}

// DTO para tiempo de retención
export class TiempoRetencionDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  central?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  gestion?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  total?: number;
}

// DTO para disposición final
export class DisposicionFinalDto {
  @IsOptional()
  @IsEnum(SeleccionEnum)
  seleccion?: SeleccionEnum;

  @IsOptional()
  @IsEnum(EliminacionEnum)
  eliminacion?: EliminacionEnum;
}

// DTO principal para crear/actualizar Listado Maestro
export class CreateListadoMaestroDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEnum(ProcesoEnum)
  @IsNotEmpty()
  proceso: ProcesoEnum;

  @IsEnum(TipoDocumentoEnum)
  @IsNotEmpty()
  tipoDocumento: TipoDocumentoEnum;

  @IsString()
  @IsNotEmpty()
  version: string;

  @IsString()
  @IsNotEmpty()
  responsable: string;

  @IsOptional()
  @IsString()
  ubicacionFisica?: string;

  @IsOptional()
  @IsString()
  ubicacionMagnetica?: string;

  @IsOptional()
  @Type(() => TiempoRetencionDto)
  tiempoRetencion?: TiempoRetencionDto;

  @IsOptional()
  @Type(() => DisposicionFinalDto)
  disposicionFinal?: DisposicionFinalDto;

  @IsOptional()
  @IsEnum(EstadoDocumentoEnum)
  estado?: EstadoDocumentoEnum;

  @IsOptional()
  @IsString()
  formatoId?: string;

  @IsOptional()
  @IsString()
  vigencia?: string;

  @IsOptional()
  @IsString()
  motivoCambio?: string;

  @IsOptional()
  @IsString()
  versionAnterior?: string;

  @IsOptional()
  @IsDateString()
  fechaCambio?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  activo?: boolean;
}

// DTO para actualizar Listado Maestro (todos los campos opcionales)
export class UpdateListadoMaestroDto {
  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEnum(ProcesoEnum)
  proceso?: ProcesoEnum;

  @IsOptional()
  @IsEnum(TipoDocumentoEnum)
  tipoDocumento?: TipoDocumentoEnum;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  responsable?: string;

  @IsOptional()
  @IsString()
  ubicacionFisica?: string;

  @IsOptional()
  @IsString()
  ubicacionMagnetica?: string;

  @IsOptional()
  @Type(() => TiempoRetencionDto)
  tiempoRetencion?: TiempoRetencionDto;

  @IsOptional()
  @Type(() => DisposicionFinalDto)
  disposicionFinal?: DisposicionFinalDto;

  @IsOptional()
  @IsEnum(EstadoDocumentoEnum)
  estado?: EstadoDocumentoEnum;

  @IsOptional()
  @IsString()
  formatoId?: string;

  @IsOptional()
  @IsString()
  vigencia?: string;

  @IsOptional()
  @IsString()
  motivoCambio?: string;

  @IsOptional()
  @IsString()
  versionAnterior?: string;

  @IsOptional()
  @IsDateString()
  fechaCambio?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  activo?: boolean;
}

// DTO para cambiar estado del documento (aprobar/rechazar)
export class CambiarEstadoDto {
  @IsString()
  @IsNotEmpty()
  documentoId: string;

  @IsEnum(EstadoDocumentoEnum)
  @IsNotEmpty()
  nuevoEstado: EstadoDocumentoEnum;

  @IsOptional()
  @IsString()
  comentarios?: string;

  @IsOptional()
  @IsString()
  usuarioRevisa?: string;

  @IsOptional()
  @IsString()
  motivoCambio?: string;
}

// DTO para filtros de búsqueda
export class FiltrosListadoMaestroDto {
  @IsOptional()
  @IsEnum(ProcesoEnum)
  proceso?: ProcesoEnum;

  @IsOptional()
  @IsEnum(TipoDocumentoEnum)
  tipoDocumento?: TipoDocumentoEnum;

  @IsOptional()
  @IsEnum(EstadoDocumentoEnum)
  estado?: EstadoDocumentoEnum;

  @IsOptional()
  @IsString()
  responsable?: string;

  @IsOptional()
  @IsString()
  busqueda?: string; // Para buscar en código o nombre

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  activo?: boolean;
}

// DTO para exportación a Excel
export class ExportarExcelDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  campos?: string[]; // Campos específicos a exportar

  @IsOptional()
  @Type(() => FiltrosListadoMaestroDto)
  filtros?: FiltrosListadoMaestroDto;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  incluirInactivos?: boolean;
}