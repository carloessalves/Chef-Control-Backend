import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service.js';
import { PERMISSIONS_KEY } from './permissions.decorator.js';
import { PermissionAction } from './permissions.enum.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PermissionAction[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user; // preenchido pela JwtStrategy

    if (!user?.roleId) {
      throw new ForbiddenException('Usuário sem papel definido.');
    }

    const rolePermissions = await this.prisma.perfilPermissao.findMany({
    where: { perfilId: user.roleId },
    include: { permissao: true },
    });

    const userActions = rolePermissions.map(
  (rp: { permissao: { nome: string } }) => rp.permissao.nome,
    );
    const hasAll = required.every((perm) => userActions.includes(perm));

    if (!hasAll) {
      throw new ForbiddenException('Permissão insuficiente para esta ação.');
    }

    return true;
  }
}
