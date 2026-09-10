import { Module } from '@nestjs/common';
import { UnidadesService } from './unidades.service.js';
import { UnidadesController } from './unidades.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [UnidadesController],
  providers: [UnidadesService],
  exports: [UnidadesService],
})
export class UnidadesModule {}
