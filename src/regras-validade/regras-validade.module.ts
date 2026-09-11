import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { RegrasValidadeController } from './regras-validade.controller';
import { RegrasValidadeService } from './regras-validade.service';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [RegrasValidadeController],
  providers: [RegrasValidadeService],
})
export class RegrasValidadeModule {}
