import { Module } from '@nestjs/common';
import { FormatosController } from './formatos.controller';
import { FormatosService } from './formatos.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FormatosSchema } from './Formatos.Model';
import { GridFsService } from 'src/gridfs/gridfs.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Formatos', schema: FormatosSchema },  // Modelo de Formatos
    ]),
  ],
  controllers: [FormatosController],
  providers: [FormatosService, GridFsService]
})
export class FormatosModule {}
