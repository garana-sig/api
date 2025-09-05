import { Module } from '@nestjs/common';
import { ListadoMaestroService } from './listado-maestro.service';
import { ListadoMaestroController } from './listado-maestro.controller';
import { CodigoGeneratorService } from './CodigoGenerator.service';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { FormatosSchema } from 'src/formatos/Formatos.Model';
import { ListadoMaestroSchema } from './ListadoMaestro.Model';
import { PropuestaSchema } from 'src/Propuestas/PropuestasModel';

@Module({
  imports: [
        MongooseModule.forFeature([{name:'Formatos', schema: FormatosSchema}]),
        MongooseModule.forFeature([{name:'ListadoMaestro', schema: ListadoMaestroSchema}]),
        MongooseModule.forFeature([{name:'Propuestas', schema: PropuestaSchema}]),

  ],
  controllers: [ListadoMaestroController],
  providers: [ListadoMaestroService, CodigoGeneratorService],
})
export class ListadoMaestroModule {}
