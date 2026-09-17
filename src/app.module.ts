import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { UnidadesModule } from './unidades/unidades.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { EmissoresModule } from './emissores/emissores.module.js';
import { CategoriasProdutoModule } from './categorias-produto/categorias-produto.module.js';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { ProdutosManipuladosModule } from './produtos-manipulados/produtos-manipulados.module.js';
import { DispositivosModule } from './dispositivos/dispositivos.module.js';
import { RegrasValidadeModule } from './regras-validade/regras-validade.module.js';
import { SharedAuthModule } from './auth/shared-auth.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { EtiquetasModule } from './etiquetas/etiquetas.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    PrismaModule, UnidadesModule, EmissoresModule, CategoriasProdutoModule,
    AuthModule, UsuariosModule, ProdutosManipuladosModule, DispositivosModule,
    RegrasValidadeModule, SharedAuthModule, ScheduleModule.forRoot(),
    EtiquetasModule,HealthModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos
        limit: 20,  // limite padrão global (rotas sem @Throttle específico)
      },
    ]),
  ],
  providers: [
    // Ordem importa: Throttler roda primeiro, depois auth, depois roles
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
