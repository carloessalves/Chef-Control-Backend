import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProdutosManipuladosService } from './produtos-manipulados.service';
import { ProdutosManipuladosController } from './produtos-manipulados.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ProdutosManipuladosController],
  providers: [ProdutosManipuladosService],
  exports: [ProdutosManipuladosService],
})
export class ProdutosManipuladosModule {}
