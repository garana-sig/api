import { Body, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { GridFsService } from 'src/gridfs/gridfs.service';
import { Response } from 'express';  // Para manejar la respuesta
import { FileInterceptor } from '@nestjs/platform-express';
import { FormatosDto } from './FormatosDto';
import { FormatosService } from './formatos.service';


@Controller('formatos')
export class FormatosController {
  constructor(private readonly gridFsService: GridFsService,
    private readonly formatosService: FormatosService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() formatoDto: FormatosDto
  ) {
    if (file) {
      // Subir el archivo al GridFS Bucket
      const fileData = await this.gridFsService.uploadFile(file);

      // Asignar la URL del archivo (ID de GridFS)
      formatoDto.archivo = {
        nombre: file.originalname,
        extension: file.mimetype,
        url: fileData.fileId.toString(),  // Guardar el ID de GridFS como URL
        peso: file.size,
      };
    }
    
    const fileCreated = await this.formatosService.createFile(formatoDto)
    
    return { ok: true, file: fileCreated };
  }

   // Endpoint para descargar un archivo por su ID
   @Get('download/:id')
   async downloadFile(@Param('id') id: string, @Res() res: Response): Promise<void> {
     return await this.formatosService.downloadFile(id, res);
   }

   @Get('all')
   async finAll (){
    return await this.formatosService.findAll()
   }
  }   