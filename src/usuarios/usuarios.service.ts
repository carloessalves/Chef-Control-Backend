import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PapelUsuario, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUsuarioDto, requester: AuthenticatedUser) {
    // Apenas ADMIN pode criar usuário em unidade diferente da sua
    this.verificarAcessoUnidade(requester, dto.unidadeId);

    const pinHash = await AuthService.hashPin(dto.pin);

    try {
      const usuario = await this.prisma.usuario.create({
        data: { ...dto, pin: pinHash },
      });
      return this.omitirPin(usuario);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um usuário com este PIN nesta unidade.');
      }
      throw error;
    }
  }

  async findAll(requester: AuthenticatedUser) {
  const where =
    requester.papel === PapelUsuario.ADMIN
      ? {}
      : { unidadeId: requester.unidadeId };

     const usuarios = await this.prisma.usuario.findMany({ where });
        return usuarios.map((u: (typeof usuarios)[number]) => this.omitirPin(u));
    }

  async findOne(id: string, requester: AuthenticatedUser) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    this.verificarAcessoUnidade(requester, usuario.unidadeId);
    return this.omitirPin(usuario);
  }

  async update(
    id: string,
    dto: UpdateUsuarioDto,
    requester: AuthenticatedUser,
  ) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    this.verificarAcessoUnidade(requester, usuario.unidadeId);

    // Se o payload trouxer unidadeId diferente, valida acesso à unidade de destino também
    if (dto.unidadeId) {
      this.verificarAcessoUnidade(requester, dto.unidadeId);
    }

    const data: Prisma.UsuarioUpdateInput = { ...dto };

    if (dto.pin) {
      data.pin = await AuthService.hashPin(dto.pin);
    }

    try {
      const atualizado = await this.prisma.usuario.update({
        where: { id },
        data,
      });
      return this.omitirPin(atualizado);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um usuário com este PIN nesta unidade.');
      }
      throw error;
    }
  }

  async remove(id: string, requester: AuthenticatedUser) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    this.verificarAcessoUnidade(requester, usuario.unidadeId);

    // Soft delete — mantém histórico de auditoria/etiquetas emitidas intacto
    const desativado = await this.prisma.usuario.update({
      where: { id },
      data: { ativo: false },
    });

    return this.omitirPin(desativado);
  }

  // ADMIN acessa qualquer unidade; demais papéis só a própria
  private verificarAcessoUnidade(requester: AuthenticatedUser, unidadeId: string) {
    if (requester.papel !== PapelUsuario.ADMIN && requester.unidadeId !== unidadeId) {
      throw new ForbiddenException('Você não tem acesso a esta unidade.');
    }
  }

  // Nunca retorna o hash do PIN nas respostas da API
  private omitirPin<T extends { pin: string }>(usuario: T) {
    const { pin, ...resto } = usuario;
    return resto;
  }
}
