import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  static async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, SALT_ROUNDS);
  }

  // Lista de usuários da unidade do dispositivo, para a tela de seleção
  // antes do PIN (usuarios, relatorios, auditoria).
  async listarUsuariosDaUnidade(unidadeId: string) {
    return this.prisma.usuario.findMany({
      where: { unidadeId, ativo: true },
      select: { id: true, nome: true, funcao: true, papel: true },
      orderBy: { nome: 'asc' },
    });
  }

  async login(dto: LoginDto, unidadeId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });

    // Garante que o usuário selecionado pertence à mesma unidade do
    // dispositivo que está fazendo a requisição.
    if (!usuario || !usuario.ativo || usuario.unidadeId !== unidadeId) {
      throw new UnauthorizedException('Usuário inválido ou inativo.');
    }

    const pinValido = await bcrypt.compare(dto.pin, usuario.pin);
    if (!pinValido) {
      throw new UnauthorizedException('PIN inválido.');
    }

    return this.gerarToken(usuario);
  }

  private gerarToken(usuario: {
    id: string;
    papel: string;
    unidadeId: string;
    nome: string;
  }) {
    const payload = {
      sub: usuario.id,
      papel: usuario.papel,
      unidadeId: usuario.unidadeId,
      nome: usuario.nome,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '2h') as any,
    });

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        papel: usuario.papel,
        unidadeId: usuario.unidadeId,
      },
    };
  }
}

