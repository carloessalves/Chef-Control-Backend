import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { SyncOutboxModule } from '../sync-outbox/sync-outbox.module.js'; // 🆕
import { ProdutosManipuladosService } from './produtos-manipulados.service';
import { ProdutosManipuladosController } from './produtos-manipulados.controller';

@Module({
  imports: [PrismaModule, AuditoriaModule, SyncOutboxModule], // 🆕
  controllers: [ProdutosManipuladosController],
  providers: [ProdutosManipuladosService],
  exports: [ProdutosManipuladosService],
})
export class ProdutosManipuladosModule {}
