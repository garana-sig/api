import mongoose from 'mongoose';

export const ListadoMaestroSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    // Ejemplos: RE-GS-01, PR-DP-01, MN-DP-01, etc.
  },
  nombre: {
    type: String,
    required: true,
  },
  proceso: {
    type: String,
    required: true,
    enum: ['DIRECCION Y PLANEACION ESTRATEGICA', 
   'GESTION DE LA CALIDAD Y SST' ,
   'GESTION DE CLIENTES ' ,
  'GESTION DE PRODUCCION' ,
  'GESTIÓN DE TALENTO HUMANO', 
   'GESTION DE PROVEEDORES' ,
  'GESTION CONTABLE Y FINANCIERA'],
  },
  tipoDocumento: {
    type: String,
    required: true,
    enum: ['manual', 'procedimiento', 'registro', 'instructivo'],
  },
  version: {
    type: String,
    required: true,
    default: '1',
  },
  fechaCreacion: {
    type: Date,
    required: true,
    default: Date.now,
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now,
  },
  responsable: {
    type: String,
    required: true,
  },
  ubicacionFisica: {
    type: String,
    // Ubicación física del documento
  },
  ubicacionMagnetica: {
    type: String,
    // Ubicación digital/magnética del documento
  },
  tiempoRetencion: {
    central: {
      type: Number,
      // Tiempo de retención en años (central)
    },
    gestion: {
      type: Number,
      // Tiempo de retención en gestión (años)
    },
    total: {
      type: Number,
      // Tiempo total de conservación
    },
  },
  disposicionFinal: {
    seleccion: {
      type: String,
      enum: ['conservar', 'eliminar', 'microfilmar'],
    },
    eliminacion: {
      type: String,
      enum: ['pendiente', 'ejecutada', 'no_aplica'],
    },
  },
  estado: {
    type: String,
    required: true,
    enum: ['borrador', 'pendiente_aprobacion', 'aprobado', 'rechazado', 'en_revision', 'obsoleto'],
    default: 'borrador',
  },
  // Referencia al archivo en GridFS (si existe)
  formatoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formatos',
  },
  // Referencias a propuestas pendientes
  propuestasPendientes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propuestas',
  }],
  // Campos adicionales del PDF
  vigencia: {
    type: String,
    // Campo de vigencia del documento
  },
  motivoCambio: {
    type: String,
    // Motivo del último cambio
  },
  versionAnterior: {
    type: String,
    // Versión anterior del documento
  },
  fechaCambio: {
    type: Date,
    // Fecha del último cambio
  },
  // Metadatos adicionales
  observaciones: {
    type: String,
    // Observaciones o notas adicionales
  },
  activo: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Índices para optimizar consultas
ListadoMaestroSchema.index({ codigo: 1 });
ListadoMaestroSchema.index({ proceso: 1 });
ListadoMaestroSchema.index({ tipoDocumento: 1 });
ListadoMaestroSchema.index({ estado: 1 });
ListadoMaestroSchema.index({ responsable: 1 });

// Middleware para actualizar fechaActualizacion
ListadoMaestroSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.fechaActualizacion = new Date();
  }
  next();
});

export interface IListadoMaestro extends mongoose.Document {
  codigo: string;
  nombre: string;
  proceso: 'DIRECCION Y PLANEACION ESTRATEGICA' 
  | 'GESTION DE LA CALIDAD Y SST' 
  | 'GESTION DE CLIENTES ' 
  | 'GESTION DE PRODUCCION' 
  | 'GESTIÓN DE TALENTO HUMANO' 
  | 'GESTION DE PROVEEDORES' 
  | 'GESTION CONTABLE Y FINANCIERA';

  tipoDocumento: 'manual' | 'procedimiento' | 'registro' | 'instructivo';
  version: string;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  responsable: string;
  ubicacionFisica?: string;
  ubicacionMagnetica?: string;
  tiempoRetencion: {
    central?: number;
    gestion?: number;
    total?: number;
  };
  disposicionFinal: {
    seleccion?: 'conservar' | 'eliminar' | 'microfilmar';
    eliminacion?: 'pendiente' | 'ejecutada' | 'no_aplica';
  };
  estado: 'borrador' | 'pendiente_aprobacion' | 'aprobado' | 'rechazado' | 'en_revision' | 'obsoleto';
  formatoId?: mongoose.Types.ObjectId;
  propuestasPendientes: mongoose.Types.ObjectId[];
  vigencia?: string;
  motivoCambio?: string;
  versionAnterior?: string;
  fechaCambio?: Date;
  observaciones?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}