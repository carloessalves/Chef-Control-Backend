// src/usuarios/usuarios.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUsuarioDto) {
    const pinHash = await bcrypt.hash(dto.pin, 10);
    return this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        pin: pinHash,
        perfilId: dto.perfilId,
      },
      select: { id: true, nome: true, perfilId: true }, // nunca retornar o hash
    });
  }

  findAll() {
    return this.prisma.usuario.findMany({
      select: { id: true, nome: true, perfilId: true, perfil: true },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nome: true, perfilId: true, perfil: true },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }

  // Usado internamente pelo AuthService — inclui o hash do PIN
  async findAllWithPin() {
    return this.prisma.usuario.findMany();
  }
}
