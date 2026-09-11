import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EtiquetasService } from './etiquetas.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { TipoEvento } from '@prisma/client';

@Injectable()
export class EtiquetasCronService {
  private readonly logger = new Logger(EtiquetasCronService.name);

  constructor(
    private readonly etiquetasService: EtiquetasService,
    private readonly auditoria: AuditoriaService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async marcarEtiquetasVencidas() {
    const quantidade = await this.etiquetasService.marcarVencidas();

    if (quantidade > 0) {
      this.logger.log(`${quantidade} etiqueta(s) marcada(s) como VENCIDA.`);
      await this.auditoria.registrar({
        tipoEvento: TipoEvento.UPDATE,
        entidade: 'Etiqueta',
        dadosDepois: { quantidadeVencidas: quantidade },
      });
    }
  }
}
