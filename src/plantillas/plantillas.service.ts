// plantilla.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plantilla } from './plantilla.schema';

@Injectable()
export class PlantillasService {
    constructor(
        @InjectModel('Plantillas') private plantillaModel: Model<Plantilla>
    ) {}

    async subirPlantilla(file: Express.Multer.File) {
        // Desactivar plantillas anteriores
        await this.plantillaModel.updateMany({}, { activo: false });

        // Crear nueva plantilla
        const plantilla = new this.plantillaModel({
            nombre: file.originalname,
            extension: file.originalname.split('.').pop(),
            url: `plantillas/${file.originalname}`,
            mimetype: file.mimetype,
            buffer: file.buffer,
            activo: true
        });

        return await plantilla.save();
    }

    async obtenerPlantillaActiva(): Promise<Plantilla> {
        const plantilla = await this.plantillaModel.findOne({ activo: true });
        if (!plantilla) {
            throw new NotFoundException('No hay plantilla activa');
        }
        return plantilla;
    }
}
