import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IMandoIntegral } from './MandoIntegral.Model';
import { FormulasMandoIService } from 'src/formulas_mando-i/formulas_mando-i.service';
import { MandoIntegralDto } from './MandoIntegral.Dto';

@Injectable()
export class MandoIntegralService {
    constructor(
        @InjectModel('MandoIntegral') private readonly mandoIntegralModel: Model<IMandoIntegral>,
        private readonly formulaService: FormulasMandoIService
    ) {}

    async create(mandoIntegralDto: MandoIntegralDto): Promise<IMandoIntegral> {
        try {
            // Verificar que la fórmula existe
            if (mandoIntegralDto.formula) {
                const formulaExists = await this.formulaService.findOne(mandoIntegralDto.formula.toString());
                if (!formulaExists) {
                    throw new BadRequestException(`La fórmula especificada no existe`);
                }
            }

            const mandoIntegral = new this.mandoIntegralModel(mandoIntegralDto);
            return await mandoIntegral.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new BadRequestException('Ya existe un indicador con este nombre');
            }
            throw error;
        }
    }

    async findAll(): Promise<IMandoIntegral[]> {
        return await this.mandoIntegralModel
            .find()
            .populate('formula') // Cambiado de formulaId a formula
            .exec();
    }

    async findOne(id: string): Promise<IMandoIntegral> {
        const mandoIntegral = await this.mandoIntegralModel
            .findById(id)
            .populate('formula') // Cambiado de formulaId a formula
            .exec();

        if (!mandoIntegral) {
            throw new NotFoundException(`Indicador con ID ${id} no encontrado`);
        }
        return mandoIntegral;
    }

    async update(id: string, mandoIntegralDto: MandoIntegralDto): Promise<IMandoIntegral | null> {
        // Verificar que existe el indicador
        const existingIndicador = await this.mandoIntegralModel.findById(id).exec();
        if (!existingIndicador) {
            throw new NotFoundException(`Indicador con ID ${id} no encontrado`);
        }

        // Verificar que la nueva fórmula existe si se está actualizando
        if (mandoIntegralDto.formula) {
            const formulaExists = await this.formulaService.findOne(mandoIntegralDto.formula.toString());
            if (!formulaExists) {
                throw new BadRequestException(`La fórmula especificada no existe`);
            }
        }

        return await this.mandoIntegralModel
            .findByIdAndUpdate(id, mandoIntegralDto, { new: true })
            .populate('formula')
            .exec();
    }

    async remove(id: string): Promise<IMandoIntegral> {
        const mandoIntegral = await this.mandoIntegralModel
            .findByIdAndDelete(id)
            .exec();

        if (!mandoIntegral) {
            throw new NotFoundException(`Indicador con ID ${id} no encontrado`);
        }
        return mandoIntegral;
    }

    // Métodos adicionales específicos
    async findByPerspectiva(perspectiva: string): Promise<IMandoIntegral[]> {
        return await this.mandoIntegralModel
            .find({ perspectiva })
            .populate('formula')
            .exec();
    }

    async findByTipoIndicador(tipoIndicador: string): Promise<IMandoIntegral[]> {
        return await this.mandoIntegralModel
            .find({ tipoIndicador })
            .populate('formula')
            .exec();
    }

    async findByProceso(ProcesoFuenteInformacion: string): Promise<IMandoIntegral[]> {
        return await this.mandoIntegralModel
            .find({ ProcesoFuenteInformacion })
            .populate('formula')
            .exec();
    }
}