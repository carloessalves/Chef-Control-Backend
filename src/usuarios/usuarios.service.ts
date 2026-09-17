import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PapelUsuario, Prisma, TipoEvento } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AtualizarProprioPinDto } from './dto/atualizar-proprio-pin.dto';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class UsuariosService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateUsuarioDto, requester: AuthenticatedUser) {
    // Apenas ADMIN pode criar usuário em unidade diferente da sua
    this.verificarAcessoUnidade(requester, dto.unidadeId);

    const pinHash = await AuthService.hashPin(dto.pin);

    try {
      const usuario = await this.prisma.$transaction(async (tx) => {
        const criado = await tx.usuario.create({
          data: { ...dto, pin: pinHash },
        });

        await this.auditoria.registrar(
          {
            usuarioId: requester.sub,
            papelNoMomento: requester.papel,
            tipoEvento: TipoEvento.CREATE,
            entidade: 'Usuario',
            entidadeId: criado.id,
            dadosDepois: this.serializarParaAuditoria(criado),
          },
          tx,
        );

        return criado;
      });

      return this.omitirPin(usuario);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Já existe um usuário com este PIN nesta unidade.');
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Unidade informada não existe.');
        }
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
    const usuarioAntes = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuarioAntes) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    this.verificarAcessoUnidade(requester, usuarioAntes.unidadeId);

    // Se o payload trouxer unidadeId diferente, valida acesso à unidade de destino também
    if (dto.unidadeId) {
      this.verificarAcessoUnidade(requester, dto.unidadeId);
    }

    const data: Prisma.UsuarioUpdateInput = { ...dto };

    if (dto.pin) {
      data.pin = await AuthService.hashPin(dto.pin);
    }

    try {
      const atualizado = await this.prisma.$transaction(async (tx) => {
        const usuarioAtualizado = await tx.usuario.update({
          where: { id },
          data,
        });

        await this.auditoria.registrar(
          {
            usuarioId: requester.sub,
            papelNoMomento: requester.papel,
            tipoEvento: TipoEvento.UPDATE,
            entidade: 'Usuario',
            entidadeId: usuarioAtualizado.id,
            dadosAntes: this.serializarParaAuditoria(usuarioAntes),
            dadosDepois: this.serializarParaAuditoria(usuarioAtualizado),
          },
          tx,
        );

        return usuarioAtualizado;
      });

      return this.omitirPin(atualizado);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Já existe um usuário com este PIN nesta unidade.');
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Unidade informada não existe.');
        }
      }
      throw error;
    }
  }

  // Self-service: o próprio usuário troca seu PIN, mediante confirmação do PIN atual.
  // Não exige papel específico — qualquer usuário autenticado pode chamar,
  // pois altera apenas o próprio registro (requester.sub).
  async updateOwnPin(dto: AtualizarProprioPinDto, requester: AuthenticatedUser) {
    const usuarioAntes = await this.prisma.usuario.findUnique({
      where: { id: requester.sub },
    });

    if (!usuarioAntes) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const pinValido = await AuthService.verificarPin(dto.pinAtual, usuarioAntes.pin);
    if (!pinValido) {
      throw new BadRequestException('PIN atual incorreto.');
    }

    const novoPinHash = await AuthService.hashPin(dto.novoPin);

    const atualizado = await this.prisma.$transaction(async (tx) => {
      const usuarioAtualizado = await tx.usuario.update({
        where: { id: requester.sub },
        data: { pin: novoPinHash },
      });

      await this.auditoria.registrar(
        {
          usuarioId: requester.sub,
          papelNoMomento: requester.papel,
          tipoEvento: TipoEvento.UPDATE,
          entidade: 'Usuario',
          entidadeId: usuarioAtualizado.id,
          // Nunca inclui o PIN (nem hash) — apenas sinaliza a troca
          dadosAntes: { pin: '***' },
          dadosDepois: { pin: '***', alteradoEm: new Date().toISOString() },
        },
        tx,
      );

      return usuarioAtualizado;
    });

    return this.omitirPin(atualizado);
  }

  async remove(id: string, requester: AuthenticatedUser) {
    const usuarioAntes = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuarioAntes) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    this.verificarAcessoUnidade(requester, usuarioAntes.unidadeId);

    // Soft delete — mantém histórico de auditoria/etiquetas emitidas intacto
    const desativado = await this.prisma.$transaction(async (tx) => {
      const usuarioDesativado = await tx.usuario.update({
        where: { id },
        data: { ativo: false },
      });

      await this.auditoria.registrar(
        {
          usuarioId: requester.sub,
          papelNoMomento: requester.papel,
          tipoEvento: TipoEvento.DELETE,
          entidade: 'Usuario',
          entidadeId: usuarioDesativado.id,
          dadosAntes: this.serializarParaAuditoria(usuarioAntes),
          dadosDepois: this.serializarParaAuditoria(usuarioDesativado),
        },
        tx,
      );

      return usuarioDesativado;
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

  // Nunca registra o PIN (nem hash) no log de auditoria
  private serializarParaAuditoria<T extends { pin?: string }>(usuario: T) {
    const { pin, ...resto } = usuario;
    return resto as Prisma.InputJsonValue;
  }
}
