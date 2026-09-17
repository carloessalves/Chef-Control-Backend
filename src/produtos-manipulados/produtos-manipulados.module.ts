import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ProdutosManipuladosService } from './produtos-manipulados.service';
import { ProdutosManipuladosController } from './produtos-manipulados.controller';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [ProdutosManipuladosController],
  providers: [ProdutosManipuladosService],
  exports: [ProdutosManipuladosService],
})
export class ProdutosManipuladosModule {}
