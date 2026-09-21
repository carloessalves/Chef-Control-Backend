import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SyncOutboxService } from './sync-outbox.service.js';

@Module({
  imports: [PrismaModule],
  providers: [SyncOutboxService],
  exports: [SyncOutboxService],
})
export class SyncOutboxModule {}
