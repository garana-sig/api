import { Injectable, NotFoundException, Res } from '@nestjs/common';
import { Response } from 'express';
import { GridFSBucket } from 'mongodb';
import { GridFsService } from 'src/gridfs/gridfs.service';
import { FormatosDto } from './FormatosDto';
import { IFormatos } from './Formatos.Model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class FormatosService {
  constructor(
    @InjectModel('Formatos') private formatoModel: Model<IFormatos>,
    private readonly gridfsService: GridFsService
  ) {}


  async createFile (formatoDto:FormatosDto):Promise <IFormatos>{
     const fileCreated= new this.formatoModel(formatoDto)
     return await fileCreated.save()
  }

  // Método para descargar el archivo por su ID
  async downloadFile(id: string, res: Response) {
    const fileInfo = await this.gridfsService.getFileById(id, res);
  
    if (!fileInfo) {
      throw new NotFoundException('Archivo no encontrado');
    }
  
    // Como la descarga ya se manejó en GridFsService, no necesitas hacer nada más aquí.
  }

  /** Consultar Todos */
  async findAll(): Promise <IFormatos[]>{
    return await this.formatoModel.find().exec()
  }

  
  
}
