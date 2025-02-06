import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Connection } from 'mongoose';
import { Response } from 'express';

@Injectable()
export class GridFsService {
  private bucket: GridFSBucket;

  constructor(@InjectConnection() private readonly connection: Connection) {
    if (!this.connection?.db) {
      throw new Error('No se pudo establecer conexión con la base de datos.');
    }
    this.bucket = new GridFSBucket(this.connection.db, {
      bucketName: 'uploads',
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<any> {
    try {
      const uploadStream = this.bucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
      });
      uploadStream.end(file.buffer);
      return { fileId: uploadStream.id }; // Devuelve el ID del archivo en GridFS
    } catch (error) {
      console.error('Error al subir archivo:', error.message);
      throw new Error('No se pudo cargar el archivo');
    }
  }

  async getFileById(fileId: string, res: Response): Promise<{ filename: string; mimeType: string } | null> {
    try {
      const fileCursor = await this.bucket.find({ _id: new ObjectId(fileId) }).toArray();
      
      if (!fileCursor || fileCursor.length === 0) {
        return null;  // Archivo no encontrado
      }
  
      const file = fileCursor[0];  // Información del archivo
      const mimeType = file.metadata?.contentType || 'application/octet-stream';
  
      // Configurar la respuesta HTTP
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  
      // Transmitir el archivo
      const downloadStream = this.bucket.openDownloadStream(new ObjectId(fileId));
      downloadStream.pipe(res);
  
      // Devolver información del archivo
      return { filename: file.filename, mimeType };
    } catch (error) {
      return null;
    }
  }

  private getMimeType(extension: string): string {
    const mimeTypes = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      default: 'application/octet-stream',
    };
    return mimeTypes[extension.toLowerCase()] || mimeTypes.default;
  }
}
