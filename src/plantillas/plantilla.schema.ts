// plantilla.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Plantilla extends Document {
    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true })
    extension: string;

    @Prop({ required: true })
    url: string;


    @Prop({ required: true })
    mimetype: string;

    @Prop({ required: true })
    buffer: Buffer;

    @Prop({ default: false })
    activo: boolean;
}

export const PlantillaSchema = SchemaFactory.createForClass(Plantilla);