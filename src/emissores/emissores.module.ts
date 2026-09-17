import { Module } from '@nestjs/common';
import { EmissoresService } from './emissores.service.js';
import { EmissoresController } from './emissores.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [EmissoresController],
  providers: [EmissoresService],
})
export class EmissoresModule {}
