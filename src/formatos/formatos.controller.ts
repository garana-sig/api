import { Body, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { GridFsService } from 'src/gridfs/gridfs.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { FormatosDto } from './FormatosDto';
import { FormatosService } from './formatos.service';
import { PropuestaDto, RevisionPropuestaDto } from '../Propuestas/PropuestasDto';
import { IPropuesta } from '../Propuestas/PropuestasModel';

@Controller('formatos')
export class FormatosController {
  constructor(
    private readonly gridFsService: GridFsService,
    private readonly formatosService: FormatosService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() formatoDto: FormatosDto
  ) {
    if (file) {
      const fileData = await this.gridFsService.uploadFile(file);
      formatoDto.archivo = {
        nombre: file.originalname,
        extension: file.mimetype,
        url: fileData.fileId.toString(),
        peso: file.size,
      };
    }
    const fileCreated = await this.formatosService.createFile(formatoDto, file);
    return { ok: true, file: fileCreated };
  }

  // ¡ACTUALIZADO! Endpoint para proponer cambios CON archivo
  @Post('propose/:id')
  @UseInterceptors(FileInterceptor('archivoModificado')) // Nuevo interceptor para archivo modificado
  async proposeUpdate(
    @Param('id') id: string, 
    @Body() propuestaDto: PropuestaDto,
    @UploadedFile() archivoModificado?: Express.Multer.File // Archivo opcional
  ): Promise<IPropuesta> {
    return this.formatosService.proposeUpdate(id, propuestaDto, archivoModificado);
  }

  // ¡ACTUALIZADO! Endpoint más específico para aprobar
  @Post('approve')
  async approveProposal(@Body() revisionDto: RevisionPropuestaDto) {
    if (revisionDto.accion !== 'aprobar') {
      throw new Error('Esta ruta es solo para aprobar propuestas');
    }
    return this.formatosService.approveProposal(revisionDto.propuestaId, revisionDto);
  }

  // ¡ACTUALIZADO! Endpoint más específico para rechazar
  @Post('reject')
  async rejectProposal(@Body() revisionDto: RevisionPropuestaDto) {
    if (revisionDto.accion !== 'rechazar') {
      throw new Error('Esta ruta es solo para rechazar propuestas');
    }
    return this.formatosService.rejectProposal(revisionDto.propuestaId, revisionDto);
  }

  // ¡NUEVO! Endpoint para descargar archivo de una propuesta específica
  @Get('proposal-file/:propuestaId')
  async downloadProposalFile(@Param('propuestaId') propuestaId: string, @Res() res: Response) {
    return this.formatosService.downloadProposalFile(propuestaId, res);
  }
  
  @Get('download/:id')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    return this.formatosService.downloadFile(id, res);
  }

  @Get('pending-proposals')
  async findAllPendingProposals() {
    return this.formatosService.findAllPendingProposals();
  }

  // ¡NUEVO! Endpoint para obtener detalles completos de una propuesta
  @Get('proposal/:id')
  async getProposalDetails(@Param('id') id: string) {
    return this.formatosService.getProposalDetails(id);
  }

  @Get('all')
  async findAll() {
    return this.formatosService.findAll();
  }
}