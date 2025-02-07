import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FormatosModule } from './formatos/formatos.module';
import { UsersModule } from './users/users.module';
import { AccionesMejoraModule } from './acciones-mejora/acciones-mejora.module';
import { PlantillasModule } from './plantillas/plantillas.module';
import 'dotenv/config';
import * as dotenv from 'dotenv';


dotenv.config();

const URL = process.env.MONGODB ?? '';

@Module({
  imports: [
    MongooseModule.forRoot (URL),
    FormatosModule,
    UsersModule,
    AccionesMejoraModule,
    PlantillasModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
