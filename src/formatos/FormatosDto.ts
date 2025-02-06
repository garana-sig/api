import { IsString, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class FormatosDto {
  @IsString()
  proceso: string;

  @IsString()
  codigo: string;

  @IsString()
  tipo: 'formato' | 'plantilla';

  @IsString()
  vigencia: string;

  
  @IsString()
  version: string;

  @IsString()
  nombre: string;

  @IsOptional()
  archivo?: {
    nombre: string;
    extension: string;
    url: string;  // ID de GridFS como URL
    peso: number;
  };
}
