import { Controller, Post, Get, Body, Param, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AccionesMejoraDto } from './AccionesMejora.Dto';
import { AccionesMejoraService } from './acciones-mejora.service';

@Controller('acciones-mejora')
export class AccionesMejoraController {
  constructor(private accionesMejoraService: AccionesMejoraService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() accionesMejoraDto: AccionesMejoraDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return await this.accionesMejoraService.create(accionesMejoraDto);
  }

  @Get('download')
  async download(@Res() res: Response) {
    const { buffer, filename } = await this.accionesMejoraService.downloadFormato();
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=${filename}`,
    });
    
    res.send(buffer);
  }
}
