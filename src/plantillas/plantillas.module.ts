import { Module } from '@nestjs/common';
import { PlantillasController } from './plantillas.controller';
import { PlantillasService } from './plantillas.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PlantillaSchema } from './plantilla.schema';

@Module({
  imports:[
MongooseModule.forFeature([{name:'Plantillas', schema: PlantillaSchema}])
  ],
  controllers: [PlantillasController],
  providers: [PlantillasService]
})
export class PlantillasModule {}
