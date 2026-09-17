import { Module } from '@nestjs/common';
import { CategoriasProdutoService } from './categorias-produto.service.js';
import { CategoriasProdutoController } from './categorias-produto.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [CategoriasProdutoController],
  providers: [CategoriasProdutoService],
})
export class CategoriasProdutoModule {}
