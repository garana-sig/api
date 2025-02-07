import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlantillasService } from './plantillas.service';

@Controller('plantillas')
export class PlantillasController {
  constructor(private plantillaService: PlantillasService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPlantilla(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }
    return await this.plantillaService.subirPlantilla(file);
  }
}