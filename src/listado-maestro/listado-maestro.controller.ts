import { 
  Body, 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Query, 
  Res,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  BadRequestException
} from '@nestjs/common';
import { Response } from 'express';
import { CodigoGeneratorService } from './CodigoGenerator.service';
import { 
  CreateListadoMaestroDto, 
  UpdateListadoMaestroDto, 
  CambiarEstadoDto, 
  FiltrosListadoMaestroDto,
  ExportarExcelDto,
  EstadoDocumentoEnum
} from './ListadoMaestroDto';
import { IListadoMaestro } from './ListadoMaestro.Model';
import { ListadoMaestroService } from './listado-maestro.service';

@Controller('listado-maestro')
@UsePipes(new ValidationPipe({ transform: true }))
export class ListadoMaestroController {
  constructor(
    private readonly listadoMaestroService: ListadoMaestroService,
    private readonly codigoGeneratorService: CodigoGeneratorService
  ) {}

  /**
   * Obtener todos los documentos del listado maestro
   */
  @Get()
  async findAll(@Query() filtros: FiltrosListadoMaestroDto): Promise<{
    ok: boolean;
    data: IListadoMaestro[];
    total: number;
  }> {
    try {
      const documentos = await this.listadoMaestroService.findAll(filtros);
      return {
        ok: true,
        data: documentos,
        total: documentos.length
      };
    } catch (error) {
      throw new BadRequestException(`Error al obtener documentos: ${error.message}`);
    }
  }

  /**
   * Crear nuevo documento en el listado maestro
   */
  @Post()
  async create(@Body() createDto: CreateListadoMaestroDto): Promise<{
    ok: boolean;
    data: IListadoMaestro;
    message: string;
  }> {
    try {
      const documento = await this.listadoMaestroService.createDocument(createDto);
      return {
        ok: true,
        data: documento,
        message: 'Documento creado exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(`Error al crear documento: ${error.message}`);
    }
  }

  /**
   * Crear documento con código automático
   */
  @Post('auto-code')
  async createWithAutoCode(@Body() createDto: Omit<CreateListadoMaestroDto, 'codigo'>): Promise<{
    ok: boolean;
    data: IListadoMaestro;
    message: string;
    codigoGenerado: string;
  }> {
    try {
      const documento = await this.listadoMaestroService.createDocumentWithAutoCode(createDto);
      return {
        ok: true,
        data: documento,
        message: 'Documento creado con código automático',
        codigoGenerado: documento.codigo
      };
    } catch (error) {
      throw new BadRequestException(`Error al crear documento con código automático: ${error.message}`);
    }
  }

  /**
   * Obtener documento específico por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{
    ok: boolean;
    data: IListadoMaestro;
  }> {
    try {
      const documento = await this.listadoMaestroService.findOne(id);
      return {
        ok: true,
        data: documento
      };
    } catch (error) {
      throw new BadRequestException(`Error al obtener documento: ${error.message}`);
    }
  }

  /**
   * Buscar documento por código
   */
  @Get('codigo/:codigo')
  async findByCodigo(@Param('codigo') codigo: string): Promise<{
    ok: boolean;
    data: IListadoMaestro;
  }> {
    try {
      const documento = await this.listadoMaestroService.findByCodigo(codigo);
      return {
        ok: true,
        data: documento
      };
    } catch (error) {
      throw new BadRequestException(`Error al buscar documento por código: ${error.message}`);
    }
  }

  /**
   * Actualizar documento
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateListadoMaestroDto
  ): Promise<{
    ok: boolean;
    data: IListadoMaestro;
    message: string;
  }> {
    try {
      const documento = await this.listadoMaestroService.updateDocument(id, updateDto);
      return {
        ok: true,
        data: documento,
        message: 'Documento actualizado exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(`Error al actualizar documento: ${error.message}`);
    }
  }

  /**
   * Aprobar documento
   */
  @Put(':id/aprobar')
  async approve(@Body() cambiarEstadoDto: CambiarEstadoDto): Promise<{
    ok: boolean;
    data: IListadoMaestro;
    message: string;
  }> {
    try {
      const documento = await this.listadoMaestroService.approveDocument(cambiarEstadoDto);
      return {
        ok: true,
        data: documento,
        message: 'Documento aprobado exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(`Error al aprobar documento: ${error.message}`);
    }
  }

  /**
   * Rechazar documento
   */
  @Put(':id/rechazar')
  async reject(@Body() cambiarEstadoDto: CambiarEstadoDto): Promise<{
    ok: boolean;
    data: IListadoMaestro;
    message: string;
  }> {
    try {
      const documento = await this.listadoMaestroService.rejectDocument(cambiarEstadoDto);
      return {
        ok: true,
        data: documento,
        message: 'Documento rechazado'
      };
    } catch (error) {
      throw new BadRequestException(`Error al rechazar documento: ${error.message}`);
    }
  }

  /**
   * Cambiar estado del documento (genérico)
   */
  @Put(':id/estado')
  async changeStatus(@Body() cambiarEstadoDto: CambiarEstadoDto): Promise<{
    ok: boolean;
    data: IListadoMaestro;
    message: string;
  }> {
    try {
      const documento = await this.listadoMaestroService.changeDocumentStatus(cambiarEstadoDto);
      return {
        ok: true,
        data: documento,
        message: `Estado cambiado a ${cambiarEstadoDto.nuevoEstado}`
      };
    } catch (error) {
      throw new BadRequestException(`Error al cambiar estado: ${error.message}`);
    }
  }

  /**
   * Obtener documentos por estado específico
   */
  @Get('estado/:estado')
  async findByStatus(@Param('estado') estado: EstadoDocumentoEnum): Promise<{
    ok: boolean;
    data: IListadoMaestro[];
    total: number;
  }> {
    try {
      const documentos = await this.listadoMaestroService.findByStatus(estado);
      return {
        ok: true,
        data: documentos,
        total: documentos.length
      };
    } catch (error) {
      throw new BadRequestException(`Error al obtener documentos por estado: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas del listado maestro
   */
  @Get('stats/resumen')
  async getStats(): Promise<{
    ok: boolean;
    data: {
      total: number;
      porEstado: { estado: string; cantidad: number }[];
      porProceso: { proceso: string; cantidad: number }[];
      porTipo: { tipo: string; cantidad: number }[];
    };
  }> {
    try {
      const stats = await this.listadoMaestroService.getStats();
      return {
        ok: true,
        data: stats
      };
    } catch (error) {
      throw new BadRequestException(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Exportar listado maestro a Excel
   */
  @Post('export/excel')
  async exportToExcel(
    @Body() exportDto: ExportarExcelDto,
    @Res() res: Response
  ): Promise<void> {
    try {
      await this.listadoMaestroService.exportToExcel(exportDto, res);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        ok: false,
        message: `Error al exportar a Excel: ${error.message}`
      });
    }
  }

  /**
   * Exportar todo el listado maestro a Excel (sin filtros)
   */
  @Get('export/excel-full')
  async exportFullToExcel(@Res() res: Response): Promise<void> {
    try {
      await this.listadoMaestroService.exportToExcel({}, res);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        ok: false,
        message: `Error al exportar listado completo: ${error.message}`
      });
    }
  }

  /**
   * Vincular documento con formato existente
   */
  @Put(':id/link-formato/:formatoId')
  async linkWithFormato(
    @Param('id') documentoId: string,
    @Param('formatoId') formatoId: string
  ): Promise<{
    ok: boolean;
    data: IListadoMaestro;
    message: string;
  }> {
    try {
      const documento = await this.listadoMaestroService.linkWithFormato(documentoId, formatoId);
      return {
        ok: true,
        data: documento,
        message: 'Documento vinculado con formato exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(`Error al vincular con formato: ${error.message}`);
    }
  }

  /**
   * Desvincular documento del formato
   */
  @Put(':id/unlink-formato')
  async unlinkFromFormato(@Param('id') documentoId: string): Promise<{
    ok: boolean;
    data: IListadoMaestro;
    message: string;
  }> {
    try {
      const documento = await this.listadoMaestroService.unlinkFromFormato(documentoId);
      return {
        ok: true,
        data: documento,
        message: 'Documento desvinculado del formato'
      };
    } catch (error) {
      throw new BadRequestException(`Error al desvincular formato: ${error.message}`);
    }
  }

  /**
   * Eliminar documento (soft delete)
   */
  @Delete(':id')
  async deleteDocument(@Param('id') id: string): Promise<{
    ok: boolean;
    data: IListadoMaestro;
    message: string;
  }> {
    try {
      const documento = await this.listadoMaestroService.deleteDocument(id);
      return {
        ok: true,
        data: documento,
        message: 'Documento eliminado exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(`Error al eliminar documento: ${error.message}`);
    }
  }

  /**
   * Restaurar documento eliminado
   */
  @Put(':id/restore')
  async restoreDocument(@Param('id') id: string): Promise<{
    ok: boolean;
    data: IListadoMaestro;
    message: string;
  }> {
    try {
      const documento = await this.listadoMaestroService.restoreDocument(id);
      return {
        ok: true,
        data: documento,
        message: 'Documento restaurado exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(`Error al restaurar documento: ${error.message}`);
    }
  }

  // ENDPOINTS DEL GENERADOR DE CÓDIGOS

  /**
   * Generar siguiente código disponible
   */
  @Get('codigo/generate/:proceso/:tipoDocumento')
  async generateNextCode(
    @Param('proceso') proceso: string,
    @Param('tipoDocumento') tipoDocumento: string
  ): Promise<{
    ok: boolean;
    codigo: string;
    info: string;
  }> {
    try {
      const codigo = await this.codigoGeneratorService.generateNextCode(proceso, tipoDocumento);
      return {
        ok: true,
        codigo,
        info: `Código generado para ${tipoDocumento} en proceso ${proceso}`
      };
    } catch (error) {
      throw new BadRequestException(`Error al generar código: ${error.message}`);
    }
  }

  /**
   * Validar formato de código
   */
  @Get('codigo/validate/:codigo')
  async validateCodigoFormat(@Param('codigo') codigo: string): Promise<{
    ok: boolean;
    isValid: boolean;
    error?: string;
    info?: any;
  }> {
    try {
      const validation = this.codigoGeneratorService.validateCodigoFormat(codigo);
      const info = validation.isValid ? this.codigoGeneratorService.parseCodigoInfo(codigo) : null;
      
      return {
        ok: true,
        isValid: validation.isValid,
        error: validation.error,
        info
      };
    } catch (error) {
      throw new BadRequestException(`Error al validar código: ${error.message}`);
    }
  }

  /**
   * Verificar si un código existe
   */
  @Get('codigo/exists/:codigo')
  async checkCodigoExists(@Param('codigo') codigo: string): Promise<{
    ok: boolean;
    exists: boolean;
    message: string;
  }> {
    try {
      const exists = await this.codigoGeneratorService.isCodigoExists(codigo);
      return {
        ok: true,
        exists,
        message: exists ? 'El código ya existe' : 'El código está disponible'
      };
    } catch (error) {
      throw new BadRequestException(`Error al verificar código: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de códigos
   */
  @Get('codigo/stats')
  async getCodigosStats(): Promise<{
    ok: boolean;
    data: {
      proceso: string;
      tipoDocumento: string;
      cantidad: number;
      ultimoCodigo: string;
    }[];
  }> {
    try {
      const stats = await this.codigoGeneratorService.getCodigosStats();
      return {
        ok: true,
        data: stats
      };
    } catch (error) {
      throw new BadRequestException(`Error al obtener estadísticas de códigos: ${error.message}`);
    }
  }

  /**
   * Generar múltiples códigos consecutivos
   */
  @Post('codigo/generate-multiple')
  async generateMultipleCodes(@Body() body: {
    proceso: string;
    tipoDocumento: string;
    cantidad: number;
  }): Promise<{
    ok: boolean;
    codigos: string[];
    message: string;
  }> {
    try {
      const { proceso, tipoDocumento, cantidad } = body;
      
      if (cantidad > 50) {
        throw new BadRequestException('No se pueden generar más de 50 códigos a la vez');
      }

      const codigos = await this.codigoGeneratorService.generateMultipleCodes(proceso, tipoDocumento, cantidad);
      return {
        ok: true,
        codigos,
        message: `${cantidad} códigos generados exitosamente`
      };
    } catch (error) {
      throw new BadRequestException(`Error al generar códigos múltiples: ${error.message}`);
    }
  }

  /**
   * Limpiar códigos reservados no utilizados
   */
  @Delete('codigo/cleanup-reserved')
  async cleanupReservedCodes(): Promise<{
    ok: boolean;
    eliminados: number;
    message: string;
  }> {
    try {
      const eliminados = await this.codigoGeneratorService.cleanupReservedCodes();
      return {
        ok: true,
        eliminados,
        message: `${eliminados} códigos reservados limpiados`
      };
    } catch (error) {
      throw new BadRequestException(`Error al limpiar códigos reservados: ${error.message}`);
    }
  }
}