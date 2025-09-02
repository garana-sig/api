import { Controller } from '@nestjs/common';
import { LmaestroService } from './lmaestro.service';

@Controller('lmaestro')
export class LmaestroController {
  constructor(private readonly lmaestroService: LmaestroService) {}
}
