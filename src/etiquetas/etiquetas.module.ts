// src/etiquetas/etiquetas.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EtiquetasController } from './etiquetas.controller.js';
import { EtiquetasService } from './etiquetas.service.js';
import { EtiquetasRepository } from './etiquetas.repository.js';
import { EtiquetasCronService } from './etiquetas.cron.js';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [EtiquetasController],
  providers: [EtiquetasService, EtiquetasRepository, EtiquetasCronService],
})
export class EtiquetasModule {}
