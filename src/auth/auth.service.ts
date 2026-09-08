// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service.js';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  async login(pin: string) {
    const usuarios = await this.usuariosService.findAllWithPin();

    // Compara o PIN informado com o hash de cada usuário
    let usuarioEncontrado = null;
    for (const usuario of usuarios) {
      const match = await bcrypt.compare(pin, usuario.pin);
      if (match) {
        usuarioEncontrado = usuario;
        break;
      }
    }

    if (!usuarioEncontrado) {
      throw new UnauthorizedException('PIN inválido');
    }

    const payload = {
      sub: usuarioEncontrado.id,
      nome: usuarioEncontrado.nome,
      perfilId: usuarioEncontrado.perfilId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuarioEncontrado.id,
        nome: usuarioEncontrado.nome,
      },
    };
  }
}
