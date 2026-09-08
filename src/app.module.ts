import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { CategoriasModule } from './categorias/categorias.module.js';
import { ProdutosModule } from './produtos/produtos.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AuditModule } from './audit/audit.module.js';

@Module({
  imports: [
    PrismaModule,
    CategoriasModule,
    ProdutosModule,
    UsuariosModule,
    AuthModule,
  ],
})
export class AppModule {}
