import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FormatosModule } from './formatos/formatos.module';
import 'dotenv/config';
import * as dotenv from 'dotenv';


dotenv.config();

const URL = process.env.MONGODB ?? '';

@Module({
  imports: [
    MongooseModule.forRoot (URL),
    FormatosModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
