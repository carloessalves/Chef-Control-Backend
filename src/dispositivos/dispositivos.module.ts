import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { DispositivosService } from './dispositivos.service';
import { DispositivosController } from './dispositivos.controller';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [DispositivosController],
  providers: [DispositivosService],
  exports: [DispositivosService],
})
export class DispositivosModule {}
