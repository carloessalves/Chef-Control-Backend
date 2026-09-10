import { Module } from '@nestjs/common';
import { CategoriasProdutoService } from './categorias-produto.service.js';
import { CategoriasProdutoController } from './categorias-produto.controller.js';

@Module({
  controllers: [CategoriasProdutoController],
  providers: [CategoriasProdutoService],
})
export class CategoriasProdutoModule {}
