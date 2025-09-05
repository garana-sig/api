import { Module } from '@nestjs/common';
import { FormatosController } from './formatos.controller';
import { FormatosService } from './formatos.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FormatosSchema } from './Formatos.Model';
import { GridFsService } from 'src/gridfs/gridfs.service';
import { PropuestaSchema } from 'src/Propuestas/PropuestasModel';
import { AccionesMejoraSchema } from 'src/acciones-mejora/AccionesMejora.Model';
import { AccionesMejoraService } from 'src/acciones-mejora/acciones-mejora.service';
import { ListadoMaestroSchema } from 'src/listado-maestro/ListadoMaestro.Model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Formatos', schema: FormatosSchema },  // Modelo de Formatos
      {name: 'Propuestas', schema: PropuestaSchema},
      {name: 'AccionesMejora' , schema:AccionesMejoraSchema},
      {name: 'ListadoMaestro', schema: ListadoMaestroSchema}
    ]),
  ],
  controllers: [FormatosController],
  providers: [
    FormatosService, 
    GridFsService,
    
  ]
})
export class FormatosModule {}
