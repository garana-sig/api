import { Body, Controller, Param, Post } from '@nestjs/common';
import { FormulasMandoIService } from './formulas_mando-i.service';
import { Formula_MandoIDto, VariableFormulaDto } from './Formulas_MandoI.Dto';

@Controller('formulas-mando-i')
export class FormulasMandoIController {

    constructor (private readonly formulasMandoService: FormulasMandoIService){}

    @Post()
async createFormula(@Body() formulaDto: Formula_MandoIDto) {
    return await this.formulasMandoService.create(formulaDto);
}

@Post(':id/variables')
async addVariable(
    @Param('id') id: string,
    @Body() variableDto: VariableFormulaDto
) {
    return await this.formulasMandoService.addVariable(id, variableDto);
}
}
