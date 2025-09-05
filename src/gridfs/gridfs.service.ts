import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Connection } from 'mongoose';
import { Response } from 'express';

@Injectable()
export class GridFsService {
  private bucket: GridFSBucket;
  private readonly logger = new Logger(GridFsService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {
    if (!this.connection?.db) {
      throw new Error('No se pudo establecer conexión con la base de datos.');
    }
    this.bucket = new GridFSBucket(this.connection.db, {
      bucketName: 'uploads',
    });
  }

  /**
   * Sube un archivo a GridFS
   * @param file - Archivo de Express Multer
   * @returns Objeto con el ID del archivo subido
   */
  async uploadFile(file: Express.Multer.File): Promise<{ fileId: ObjectId }> {
    try {
      this.logger.log(`Subiendo archivo: ${file.originalname} (${file.size} bytes)`);
      
      const uploadStream = this.bucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadDate: new Date(),
          size: file.size,
        }
      });
      
      uploadStream.end(file.buffer);
      
      this.logger.log(`Archivo subido exitosamente con ID: ${uploadStream.id}`);
      return { fileId: uploadStream.id };
    } catch (error) {
      this.logger.error(`Error al subir archivo: ${error.message}`, error.stack);
      throw new Error('No se pudo cargar el archivo');
    }
  }

  /**
   * Obtiene un archivo por ID y lo envía como respuesta HTTP
   * @param fileId - ID del archivo en GridFS
   * @param res - Objeto Response de Express
   * @returns Información del archivo o null si no existe
   */
  async getFileById(fileId: string, res: Response): Promise<{ filename: string; mimeType: string } | null> {
    try {
      this.logger.log(`Descargando archivo con ID: ${fileId}`);
      
      const fileCursor = await this.bucket.find({ _id: new ObjectId(fileId) }).toArray();
      
      if (!fileCursor || fileCursor.length === 0) {
        this.logger.warn(`Archivo no encontrado con ID: ${fileId}`);
        return null;
      }
  
      const file = fileCursor[0];
      const mimeType = file.metadata?.contentType || file.contentType || 'application/octet-stream';
  
      // Configurar headers de respuesta
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Length', file.length.toString());
  
      // Transmitir el archivo
      const downloadStream = this.bucket.openDownloadStream(new ObjectId(fileId));
      
      // Manejar errores en el stream
      downloadStream.on('error', (error) => {
        this.logger.error(`Error en stream de descarga: ${error.message}`);
        if (!res.headersSent) {
          res.status(500).send('Error al descargar archivo');
        }
      });

      downloadStream.pipe(res);
  
      this.logger.log(`Archivo enviado exitosamente: ${file.filename}`);
      return { filename: file.filename, mimeType };
    } catch (error) {
      this.logger.error(`Error al obtener archivo: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * ¡NUEVO! Elimina un archivo de GridFS
   * @param fileId - ID del archivo a eliminar
   * @returns boolean indicando si se eliminó exitosamente
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      this.logger.log(`Eliminando archivo con ID: ${fileId}`);
      
      // Verificar que el archivo existe antes de intentar eliminarlo
      const fileExists = await this.fileExists(fileId);
      if (!fileExists) {
        this.logger.warn(`Intento de eliminar archivo inexistente: ${fileId}`);
        return false;
      }

      // Eliminar el archivo
      await this.bucket.delete(new ObjectId(fileId));
      
      this.logger.log(`Archivo eliminado exitosamente: ${fileId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error al eliminar archivo ${fileId}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * ¡NUEVO! Verifica si un archivo existe en GridFS
   * @param fileId - ID del archivo a verificar
   * @returns boolean indicando si el archivo existe
   */
  async fileExists(fileId: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(fileId)) {
        this.logger.warn(`ID de archivo inválido: ${fileId}`);
        return false;
      }

      const fileCursor = await this.bucket.find({ _id: new ObjectId(fileId) }).toArray();
      return fileCursor && fileCursor.length > 0;
    } catch (error) {
      this.logger.error(`Error al verificar existencia de archivo: ${error.message}`);
      return false;
    }
  }

  /**
   * ¡NUEVO! Obtiene información de un archivo sin descargarlo
   * @param fileId - ID del archivo
   * @returns Información del archivo o null si no existe
   */
  async getFileInfo(fileId: string): Promise<{
    id: string;
    filename: string;
    contentType: string;
    length: number;
    uploadDate: Date;
    metadata?: any;
  } | null> {
    try {
      if (!ObjectId.isValid(fileId)) {
        return null;
      }

      const fileCursor = await this.bucket.find({ _id: new ObjectId(fileId) }).toArray();
      
      if (!fileCursor || fileCursor.length === 0) {
        return null;
      }

      const file = fileCursor[0];
      return {
        id: file._id.toString(),
        filename: file.filename,
        contentType: file.contentType || file.metadata?.contentType || 'application/octet-stream',
        length: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata
      };
    } catch (error) {
      this.logger.error(`Error al obtener información de archivo: ${error.message}`);
      return null;
    }
  }

  /**
   * ¡NUEVO! Obtiene el contenido de un archivo como Buffer (útil para adjuntar en emails)
   * @param fileId - ID del archivo
   * @returns Buffer con el contenido del archivo o null si no existe
   */
  async getFileBuffer(fileId: string): Promise<Buffer | null> {
    try {
      if (!ObjectId.isValid(fileId)) {
        return null;
      }

      const fileExists = await this.fileExists(fileId);
      if (!fileExists) {
        return null;
      }

      return new Promise((resolve, reject) => {
        const downloadStream = this.bucket.openDownloadStream(new ObjectId(fileId));
        const chunks: Buffer[] = [];

        downloadStream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        downloadStream.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        downloadStream.on('error', (error) => {
          this.logger.error(`Error al obtener buffer de archivo: ${error.message}`);
          reject(error);
        });
      });
    } catch (error) {
      this.logger.error(`Error al obtener buffer: ${error.message}`);
      return null;
    }
  }

  /**
   * ¡NUEVO! Lista todos los archivos en GridFS (útil para debug o administración)
   * @param limit - Límite de archivos a retornar
   * @returns Array con información básica de los archivos
   */
  async listFiles(limit: number = 50): Promise<Array<{
    id: string;
    filename: string;
    length: number;
    uploadDate: Date;
  }>> {
    try {
      const files = await this.bucket.find({}).limit(limit).toArray();
      
      return files.map(file => ({
        id: file._id.toString(),
        filename: file.filename,
        length: file.length,
        uploadDate: file.uploadDate
      }));
    } catch (error) {
      this.logger.error(`Error al listar archivos: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtiene el tipo MIME basado en la extensión del archivo
   * @param extension - Extensión del archivo
   * @returns Tipo MIME correspondiente
   */
  private getMimeType(extension: string): string {
    const mimeTypes = {
      // Documentos
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      
      // Hojas de cálculo
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      
      // Texto
      txt: 'text/plain',
      rtf: 'application/rtf',
      
      // Imágenes
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      
      // Por defecto
      default: 'application/octet-stream',
    };
    
    return mimeTypes[extension.toLowerCase()] || mimeTypes.default;
  }

  /**
   * ¡NUEVO! Método para limpiar archivos huérfanos (archivos que no están referenciados)
   * Este método es útil para mantenimiento
   * @param referencedIds - Array de IDs que están siendo referenciados
   * @returns Número de archivos eliminados
   */
  async cleanupOrphanedFiles(referencedIds: string[]): Promise<number> {
    try {
      this.logger.log('Iniciando limpieza de archivos huérfanos...');
      
      const allFiles = await this.bucket.find({}).toArray();
      const referencedObjectIds = referencedIds
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id));
      
      let deletedCount = 0;
      
      for (const file of allFiles) {
        const isReferenced = referencedObjectIds.some(refId => 
          refId.equals(file._id)
        );
        
        if (!isReferenced) {
          try {
            await this.bucket.delete(file._id);
            deletedCount++;
            this.logger.log(`Archivo huérfano eliminado: ${file.filename} (${file._id})`);
          } catch (deleteError) {
            this.logger.error(`Error al eliminar archivo huérfano ${file._id}: ${deleteError.message}`);
          }
        }
      }
      
      this.logger.log(`Limpieza completada. ${deletedCount} archivos huérfanos eliminados.`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Error en limpieza de archivos huérfanos: ${error.message}`);
      return 0;
    }
  }
}