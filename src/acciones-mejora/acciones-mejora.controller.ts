import { Controller, Post, Get, Body, Param, UseInterceptors, UploadedFile, Res, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AccionesMejoraDto } from './AccionesMejora.Dto';
import { AccionesMejoraService } from './acciones-mejora.service';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/users.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { IAccionesMejora } from './AccionesMejora.Model';

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

@Get()
async findAll(): Promise <IAccionesMejora[]>{
  const acciones_todas= await this.accionesMejoraService.find()
  return acciones_todas
}
}
