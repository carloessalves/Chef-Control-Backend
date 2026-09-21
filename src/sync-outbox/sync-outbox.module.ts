import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SyncOutboxService } from './sync-outbox.service.js';
import { SyncOutboxWorkerService } from './sync-outbox-worker.service.js';

@Module({
  imports: [PrismaModule, HttpModule],
  providers: [SyncOutboxService, SyncOutboxWorkerService],
  exports: [SyncOutboxService, SyncOutboxWorkerService],
})
export class SyncOutboxModule {}
