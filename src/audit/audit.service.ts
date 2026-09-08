import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface AuditParams {
  tenantId?: string;
  userId: string;
  deviceId?: string;
  action: string;
  entity: string;
  entityId?: string;
  roleSnapshot?: string;
  before?: any;
  after?: any;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: AuditParams) {
    return this.prisma.logAuditoria.create({
      data: {
        usuarioId: params.userId,
        acao: params.action,
        entidade: params.entity,
        entidadeId: params.entityId,
        metadados: {
          tenantId: params.tenantId,
          deviceId: params.deviceId,
          roleSnapshot: params.roleSnapshot,
          before: params.before,
          after: params.after,
        },
      },
    });
  }
}
