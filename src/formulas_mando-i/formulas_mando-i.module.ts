import { Module } from '@nestjs/common';
import { FormulasMandoIController } from './formulas_mando-i.controller';
import { FormulasMandoIService } from './formulas_mando-i.service';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Formula_MandoISchema } from './Formulas_MandoI.model';

@Module({
  imports: [MongooseModule.forFeature ([{name: 'FormulasMando', schema: Formula_MandoISchema}])],
  controllers: [FormulasMandoIController],
  providers: [FormulasMandoIService]
})
export class FormulasMandoIModule {}
