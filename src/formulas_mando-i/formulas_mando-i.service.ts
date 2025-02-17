import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IFormula_MandoI } from './Formulas_MandoI.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Formula_MandoIDto, VariableFormulaDto } from './Formulas_MandoI.Dto';

@Injectable()
export class FormulasMandoIService {

constructor (@InjectModel('FormulasMando') private readonly  formulaModel: Model<IFormula_MandoI>){}

    // Crear una nueva fórmula completa
    async create(formulaDto: Formula_MandoIDto): Promise<IFormula_MandoI> {
        try {
            // Validar que todas las variables mencionadas en la expresión matemática estén definidas
            const variablesEnExpresion = this.extraerVariables(formulaDto.expresionMatematica);
            const variablesDefinidas = formulaDto.variables.map(v => v.identificador);
            
            const variablesFaltantes = variablesEnExpresion.filter(
                v => !variablesDefinidas.includes(v)
            );

            if (variablesFaltantes.length > 0) {
                throw new BadRequestException(
                    `Las siguientes variables no están definidas: ${variablesFaltantes.join(', ')}`
                );
            }

            const formula = new this.formulaModel(formulaDto);
            return await formula.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new BadRequestException('Ya existe una fórmula con este nombre');
            }
            throw error;
        }
    }

    // Obtener todas las fórmulas
    async findAll(): Promise<IFormula_MandoI[]> {
        return await this.formulaModel.find().exec();
    }

    // Obtener una fórmula por ID
    async findOne(id: string): Promise<IFormula_MandoI> {
        const formula = await this.formulaModel.findById(id).exec();
        if (!formula) {
            throw new NotFoundException(`Fórmula con ID ${id} no encontrada`);
        }
        return formula;
    }

    // Actualizar una fórmula existente
    async update(id: string, formulaDto: Formula_MandoIDto): Promise<IFormula_MandoI | null> {
        const formula = await this.formulaModel.findById(id).exec();
        if (!formula) {
            throw new NotFoundException(`Fórmula con ID ${id} no encontrada`);
        }

        // Validar variables al actualizar
        const variablesEnExpresion = this.extraerVariables(formulaDto.expresionMatematica);
        const variablesDefinidas = formulaDto.variables.map(v => v.identificador);
        
        const variablesFaltantes = variablesEnExpresion.filter(
            v => !variablesDefinidas.includes(v)
        );

        if (variablesFaltantes.length > 0) {
            throw new BadRequestException(
                `Las siguientes variables no están definidas: ${variablesFaltantes.join(', ')}`
            );
        }

        return await this.formulaModel
            .findByIdAndUpdate(id, formulaDto, { new: true })
            .exec();
    }

    // Eliminar una fórmula
    async remove(id: string): Promise<IFormula_MandoI> {
        const formula = await this.formulaModel.findByIdAndDelete(id).exec();
        if (!formula) {
            throw new NotFoundException(`Fórmula con ID ${id} no encontrada`);
        }
        return formula;
    }

    // Agregar una nueva variable a una fórmula existente
    async addVariable(id: string, variableDto: VariableFormulaDto): Promise<IFormula_MandoI> {
        const formula = await this.formulaModel.findById(id).exec();
        if (!formula) {
            throw new NotFoundException(`Fórmula con ID ${id} no encontrada`);
        }

        // Verificar si ya existe una variable con el mismo identificador
        const existeVariable = formula.variables.some(
            v => v.identificador === variableDto.identificador
        );
        if (existeVariable) {
            throw new BadRequestException(
                `Ya existe una variable con el identificador ${variableDto.identificador}`
            );
        }

        formula.variables.push(variableDto);
        return await formula.save();
    }

    // Eliminar una variable de una fórmula
    async removeVariable(id: string, identificadorVariable: string): Promise<IFormula_MandoI> {
        const formula = await this.formulaModel.findById(id).exec();
        if (!formula) {
            throw new NotFoundException(`Fórmula con ID ${id} no encontrada`);
        }

        // Verificar si la variable está siendo usada en la expresión matemática
        if (formula.expresionMatematica.includes(identificadorVariable)) {
            throw new BadRequestException(
                `No se puede eliminar la variable ${identificadorVariable} porque está siendo usada en la fórmula`
            );
        }

        formula.variables = formula.variables.filter(
            v => v.identificador !== identificadorVariable
        );
        return await formula.save();
    }

    // Utilidad para extraer variables de una expresión matemática
    private extraerVariables(expresion: string): string[] {
        // Suponiendo que los identificadores son secuencias de letras mayúsculas
        // Por ejemplo: (IT - GT) / RPA
        const regex = /[A-Z]+/g;
        return Array.from(new Set(expresion.match(regex) || []));
    }

    // Validar una fórmula
    async validarFormula(id: string): Promise<{ isValid: boolean; message: string }> {
        const formula = await this.formulaModel.findById(id).exec();
        if (!formula) {
            throw new NotFoundException(`Fórmula con ID ${id} no encontrada`);
        }

        const variablesEnExpresion = this.extraerVariables(formula.expresionMatematica);
        const variablesDefinidas = formula.variables.map(v => v.identificador);

        const variablesFaltantes = variablesEnExpresion.filter(
            v => !variablesDefinidas.includes(v)
        );

        if (variablesFaltantes.length > 0) {
            return {
                isValid: false,
                message: `Faltan las siguientes variables: ${variablesFaltantes.join(', ')}`
            };
        }

        return {
            isValid: true,
            message: 'La fórmula es válida'
        };
    }
}
