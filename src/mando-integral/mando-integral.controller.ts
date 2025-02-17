import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Body, 
    Param, 
    Query,
    HttpStatus
} from '@nestjs/common';
import { MandoIntegralService } from './mando-integral.service';
import { MandoIntegralDto } from './MandoIntegral.Dto';

@Controller('mando-integral')
export class MandoIntegralController {
    constructor(private readonly mandoIntegralService: MandoIntegralService) {}

    @Post()
    async create(@Body() mandoIntegralDto: MandoIntegralDto) {
        return await this.mandoIntegralService.create(mandoIntegralDto);
    }

    @Get()
    async findAll(
        @Query('perspectiva') perspectiva?: string, 
        @Query('tipoIndicador') tipoIndicador?: string,
        @Query('proceso') proceso?: string
    ) {
        if (perspectiva) {
            return await this.mandoIntegralService.findByPerspectiva(perspectiva);
        }
        if (tipoIndicador) {
            return await this.mandoIntegralService.findByTipoIndicador(tipoIndicador);
        }
        if (proceso) {
            return await this.mandoIntegralService.findByProceso(proceso);
        }
        return await this.mandoIntegralService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.mandoIntegralService.findOne(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() mandoIntegralDto: MandoIntegralDto) {
        return await this.mandoIntegralService.update(id, mandoIntegralDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return await this.mandoIntegralService.remove(id);
    }
}

