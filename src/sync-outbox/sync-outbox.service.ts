import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { isLocalMode } from '../config/server-mode.config.js';
import { Prisma, SyncOutboxTipo } from '@prisma/client';

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class SyncOutboxService {
  constructor(private prisma: PrismaService) {}

  async enfileirar(
    tipo: SyncOutboxTipo,
    payload: Prisma.InputJsonValue, // 🔧 alterado
    tx?: PrismaTx,
  ) {
    if (!isLocalMode()) {
      return;
    }

    const client = tx ?? this.prisma;

    await client.syncOutbox.create({
      data: {
        tipo,
        payload,
      },
    });
  }
}
