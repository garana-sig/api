import { Module } from '@nestjs/common';
import { AccionesMejoraController } from './acciones-mejora.controller';
import { AccionesMejoraService } from './acciones-mejora.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AccionesMejoraSchema } from './AccionesMejora.Model';
import { PlantillasService } from 'src/plantillas/plantillas.service';
import { PlantillaSchema } from 'src/plantillas/plantilla.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports:[
    MongooseModule.forFeature([{name:'AccionesMejora', schema: AccionesMejoraSchema}]),
    MongooseModule.forFeature([{name:'Plantillas', schema: PlantillaSchema}]),
    ConfigModule.forRoot(),
  ],
  controllers: [AccionesMejoraController],
  providers: [AccionesMejoraService, PlantillasService]
})
export class AccionesMejoraModule {}
