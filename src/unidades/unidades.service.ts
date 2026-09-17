import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService, ActorAuditoria } from '../auditoria/auditoria.service.js';
import { CreateUnidadeDto } from './dto/create-unidade.dto.js';
import { UpdateUnidadeDto } from './dto/update-unidade.dto.js';
import { Prisma, TipoEvento, EntidadeAuditoria } from '@prisma/client';


@Injectable()
export class UnidadesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateUnidadeDto, actor: ActorAuditoria) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const unidade = await tx.unidade.create({ data: dto });

        await this.auditoria.registrar(
          {
            ...actor,
            tipoEvento: TipoEvento.CREATE,
            entidade: EntidadeAuditoria.Unidade,
            entidadeId: unidade.id,
            dadosDepois: unidade,
          },
          tx,
        );

        return unidade;
      });
    } catch (error) {
      this.handleUniqueConstraintError(error, dto);
      throw error;
    }
  }

  async findAll(includeInativas = false) {
    return this.prisma.unidade.findMany({
      where: includeInativas ? {} : { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const unidade = await this.prisma.unidade.findUnique({ where: { id } });
    if (!unidade) {
      throw new NotFoundException(`Unidade com ID ${id} não encontrada.`);
    }
    return unidade;
  }

  async update(id: string, dto: UpdateUnidadeDto, actor: ActorAuditoria) {
    const antes = await this.findOne(id); // valida existência

    try {
      return await this.prisma.$transaction(async (tx) => {
        const depois = await tx.unidade.update({ where: { id }, data: dto });

        await this.auditoria.registrar(
          {
            ...actor,
            tipoEvento: TipoEvento.UPDATE,
            entidade: EntidadeAuditoria.Unidade,
            entidadeId: id,
            dadosAntes: antes,
            dadosDepois: depois,
          },
          tx,
        );

        return depois;
      });
    } catch (error) {
      this.handleUniqueConstraintError(error, dto);
      throw error;
    }
  }

  async remove(id: string, actor: ActorAuditoria) {
    const antes = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // Soft delete: apenas inativa, nunca apaga (integridade referencial com etiquetas/produtos)
      const depois = await tx.unidade.update({
        where: { id },
        data: { ativo: false },
      });

      await this.auditoria.registrar(
        {
          ...actor,
          tipoEvento: TipoEvento.DELETE,
          entidade: EntidadeAuditoria.Unidade,
          entidadeId: id,
          dadosAntes: antes,
          dadosDepois: depois,
        },
        tx,
      );

      return depois;
    });
  }

  /**
   * Traduz violações de constraint única do Postgres (P2002) em ConflictException
   * amigável. Cobre tanto `nome` quanto `cnpj` (@unique no schema).
   */
  private handleUniqueConstraintError(
    error: unknown,
    dto: { nome?: string; cnpj?: string },
  ) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target as string[] | undefined;

      if (target?.includes('nome')) {
        throw new ConflictException(
          `Já existe uma unidade com o nome "${dto.nome}".`,
        );
      }

      if (target?.includes('cnpj')) {
        throw new ConflictException(
          `Já existe uma unidade cadastrada com o CNPJ "${dto.cnpj}".`,
        );
      }
    }
  }
}
