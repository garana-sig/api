import { Module } from '@nestjs/common';
import { MandoIntegralController } from './mando-integral.controller';
import { MandoIntegralService } from './mando-integral.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MandoIntegralSchema } from './MandoIntegral.Model';
import { FormulasMandoIService } from 'src/formulas_mando-i/formulas_mando-i.service';
import { FormulasMandoIModule } from 'src/formulas_mando-i/formulas_mando-i.module';
import { Formula_MandoISchema } from 'src/formulas_mando-i/Formulas_MandoI.model';

@Module({
  imports: [
    MongooseModule.forFeature([
        { name: 'MandoIntegral', schema: MandoIntegralSchema }
    ]) , 
    MongooseModule.forFeature([{name: 'FormulasMando', schema: Formula_MandoISchema}])
],
  controllers: [MandoIntegralController],
  providers: [MandoIntegralService, FormulasMandoIService]
})
export class MandoIntegralModule {}
