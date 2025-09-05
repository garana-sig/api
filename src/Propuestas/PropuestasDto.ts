import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class PropuestaDto {
    @IsString()
    @IsNotEmpty()
    formatoId: string;

    @IsString()
    @IsNotEmpty()
    version: string;

    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    vigencia?: string;

    @IsString()
    @IsNotEmpty()
    motivoCambio: string;

    // ¡NUEVO! Campo opcional para usuario que propone
    @IsString()
    @IsOptional()
    usuarioPropone?: string;

    // ¡NUEVO! Campo opcional para el archivo (se manejará por separado en el controller)
    @IsOptional()
    archivo?: {
        nombre: string;
        extension: string;
        url: string;
        peso: number;
    };
}

// ¡NUEVO! DTO específico para aprobar/rechazar propuestas
export class RevisionPropuestaDto {
    @IsString()
    @IsNotEmpty()
    propuestaId: string;

    @IsString()
    @IsNotEmpty()
    accion: 'aprobar' | 'rechazar';

    @IsString()
    @IsOptional()
    comentarios?: string;

    @IsString()
    @IsOptional()
    usuarioRevisa?: string;
}