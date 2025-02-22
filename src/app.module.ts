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
import { ConfigModule } from '@nestjs/config';
import { MandoIntegralModule } from './mando-integral/mando-integral.module';
import { FormulasMandoIModule } from './formulas_mando-i/formulas_mando-i.module';
import { AuthModule } from './auth/auth.module';


dotenv.config();

const URL = process.env.MONGODB ?? '';

@Module({
  imports: [
    MongooseModule.forRoot (URL),
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables de entorno estén disponibles en toda la app
    }),
    FormatosModule,
    UsersModule,
    AccionesMejoraModule,
    PlantillasModule,
    MandoIntegralModule,
    FormulasMandoIModule,
    AuthModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
