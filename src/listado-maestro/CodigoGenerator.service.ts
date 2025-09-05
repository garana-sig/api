import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IListadoMaestro } from './ListadoMaestro.Model';

interface CodigoStats {
  proceso: string;
  tipoDocumento: string;
  cantidad: number;
  ultimoCodigo: string;
}

@Injectable()
export class CodigoGeneratorService {
  
  // Mapeo de procesos a prefijos según el PDF del listado maestro
  private readonly procesosPrefijos = {
    'direccion': 'DP',
    'calidad-sst': 'GS', 
    'clientes': 'GC',
    'produccion': 'GP',
    'humana': 'GH',
    'proveedores': 'GR',
    'administrativa': 'GA'
  };

  // Mapeo de tipos de documento a prefijos según el PDF
  private readonly tipoDocumentoPrefijos = {
    'manual': 'MN',
    'procedimiento': 'PR',
    'registro': 'RE',
    'instructivo': 'IN'
  };

  constructor(
    @InjectModel('ListadoMaestro') private listadoMaestroModel: Model<IListadoMaestro>
  ) {}

  /**
   * Genera el siguiente código disponible para un proceso y tipo de documento específico
   * Formato: {TIPO}-{PROCESO}-{NUMERO}
   * Ejemplos: RE-GS-01, PR-DP-02, MN-GC-03, etc.
   */
  async generateNextCode(proceso: string, tipoDocumento: string): Promise<string> {
    // Obtener prefijos
    const prefijoProceso = this.procesosPrefijos[proceso];
    const prefijoTipo = this.tipoDocumentoPrefijos[tipoDocumento];

    if (!prefijoProceso || !prefijoTipo) {
      throw new Error(`Proceso "${proceso}" o tipo de documento "${tipoDocumento}" no válido`);
    }

    // Construir el patrón base del código
    const patronBase = `${prefijoTipo}-${prefijoProceso}`;

    // Buscar todos los códigos existentes con este patrón
    const documentosExistentes = await this.listadoMaestroModel
      .find({ 
        codigo: new RegExp(`^${patronBase}-\\d+$`, 'i'),
        activo: true
      })
      .select('codigo')
      .exec();

    // Extraer números de los códigos existentes
    const numerosExistentes = documentosExistentes
      .map(doc => {
        const match = doc.codigo.match(new RegExp(`^${patronBase}-(\\d+)$`, 'i'));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    // Encontrar el siguiente número disponible
    let siguienteNumero = 1;
    for (const numero of numerosExistentes) {
      if (numero === siguienteNumero) {
        siguienteNumero++;
      } else {
        break;
      }
    }

    // Formatear el número con ceros a la izquierda (2 dígitos)
    const numeroFormateado = siguienteNumero.toString().padStart(2, '0');

    return `${patronBase}-${numeroFormateado}`;
  }

  /**
   * Valida si un código tiene el formato correcto
   */
  validateCodigoFormat(codigo: string): { isValid: boolean; error?: string } {
    const patronCompleto = /^(MN|PR|RE|IN)-(DP|GS|GC|GP|GH|GR|GA)-\d{2}$/;
    
    if (!patronCompleto.test(codigo)) {
      return {
        isValid: false,
        error: 'El código debe seguir el formato: {TIPO}-{PROCESO}-{NUMERO} (ej: RE-GS-01)'
      };
    }

    return { isValid: true };
  }

  /**
   * Extrae información del código
   */
  parseCodigoInfo(codigo: string): {
    tipoDocumento?: string;
    proceso?: string;
    numero?: number;
    isValid: boolean;
  } {
    const validation = this.validateCodigoFormat(codigo);
    if (!validation.isValid) {
      return { isValid: false };
    }

    const match = codigo.match(/^(MN|PR|RE|IN)-(DP|GS|GC|GP|GH|GR|GA)-(\d{2})$/);
    if (!match) {
      return { isValid: false };
    }

    const [, prefijoTipo, prefijoProceso, numeroStr] = match;

    // Mapeo inverso para obtener nombres completos
    const tipoDocumentoMap = {
      'MN': 'manual',
      'PR': 'procedimiento', 
      'RE': 'registro',
      'IN': 'instructivo'
    };

    const procesoMap = {
      'DP': 'direccion',
      'GS': 'calidad-sst',
      'GC': 'clientes',
      'GP': 'produccion',
      'GH': 'humana',
      'GR': 'proveedores',
      'GA': 'administrativa'
    };

    return {
      tipoDocumento: tipoDocumentoMap[prefijoTipo],
      proceso: procesoMap[prefijoProceso],
      numero: parseInt(numeroStr, 10),
      isValid: true
    };
  }

  /**
   * Verifica si un código ya existe en el sistema
   */
  async isCodigoExists(codigo: string): Promise<boolean> {
    const existingDocument = await this.listadoMaestroModel
      .findOne({ codigo: codigo, activo: true })
      .exec();
    
    return !!existingDocument;
  }

  /**
   * Genera múltiples códigos consecutivos para migración masiva
   */
  async generateMultipleCodes(
    proceso: string, 
    tipoDocumento: string, 
    cantidad: number
  ): Promise<string[]> {
    const codigos: string[] = [];
    
    for (let i = 0; i < cantidad; i++) {
      const codigo = await this.generateNextCode(proceso, tipoDocumento);
      codigos.push(codigo);
      
      // Crear un documento temporal para reservar el código
      await this.reserveCode(codigo);
    }

    return codigos;
  }

  /**
   * Reserva temporalmente un código para evitar duplicados en operaciones masivas
   */
  private async reserveCode(codigo: string): Promise<void> {
    // Crear un documento mínimo para reservar el código
    // Este método sería utilizado internamente para operaciones masivas
    const reserva = new this.listadoMaestroModel({
      codigo,
      nombre: `RESERVADO_${codigo}`,
      proceso: 'direccion', // Valor temporal
      tipoDocumento: 'registro', // Valor temporal
      version: '0',
      responsable: 'SISTEMA',
      estado: 'borrador',
      activo: false // Marcado como inactivo hasta que se complete la migración
    });

    await reserva.save();
  }

  /**
   * Obtiene estadísticas de códigos por proceso y tipo
   */
  async getCodigosStats(): Promise<CodigoStats[]> {
    const stats: CodigoStats[] = [];
    
    for (const [proceso, prefijoProceso] of Object.entries(this.procesosPrefijos)) {
      for (const [tipoDocumento, prefijoTipo] of Object.entries(this.tipoDocumentoPrefijos)) {
        const patronBase = `${prefijoTipo}-${prefijoProceso}`;
        
        const documentos = await this.listadoMaestroModel
          .find({ 
            codigo: new RegExp(`^${patronBase}-\\d+$`, 'i'),
            activo: true
          })
          .select('codigo')
          .sort({ codigo: -1 })
          .exec();

        stats.push({
          proceso,
          tipoDocumento,
          cantidad: documentos.length,
          ultimoCodigo: documentos.length > 0 ? documentos[0].codigo : `${patronBase}-00`
        });
      }
    }

    return stats;
  }

  /**
   * Limpia códigos reservados que no se completaron
   */
  async cleanupReservedCodes(): Promise<number> {
    const result = await this.listadoMaestroModel
      .deleteMany({
        nombre: new RegExp('^RESERVADO_'),
        activo: false,
        createdAt: { $lt: new Date(Date.now() - 1000 * 60 * 60) } // Más de 1 hora
      })
      .exec();

    return result.deletedCount || 0;
  }
}