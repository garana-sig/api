import { Module } from '@nestjs/common';
import { LmaestroService } from './lmaestro.service';
import { LmaestroController } from './lmaestro.controller';

@Module({
  controllers: [LmaestroController],
  providers: [LmaestroService],
})
export class LmaestroModule {}
