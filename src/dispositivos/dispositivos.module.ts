import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DispositivosService } from './dispositivos.service';
import { DispositivosController } from './dispositivos.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DispositivosController],
  providers: [DispositivosService],
  exports: [DispositivosService],
})
export class DispositivosModule {}
