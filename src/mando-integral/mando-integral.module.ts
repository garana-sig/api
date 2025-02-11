import { Module } from '@nestjs/common';
import { MandoIntegralController } from './mando-integral.controller';
import { MandoIntegralService } from './mando-integral.service';

@Module({
  controllers: [MandoIntegralController],
  providers: [MandoIntegralService]
})
export class MandoIntegralModule {}
