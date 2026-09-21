// src/etiquetas/etiquetas.controller.ts
import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { EtiquetasService } from './etiquetas.service.js';
import { DispositivoGuard } from '../dispositivos/dispositivo.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentDevice, AuthenticatedDevice } from '../auth/decorators/current-device.decorator.js';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { CriarEtiquetaDto } from './dto/criar-etiqueta.dto.js';
import { ReimprimirEtiquetaDto } from './dto/reimprimir-etiqueta.dto.js';
import { AtualizarStatusEtiquetaDto } from './dto/atualizar-status-etiqueta.dto.js';
import { ListarEtiquetasDto } from './dto/listar-etiquetas.dto.js';
import { PapelUsuario } from '@prisma/client';

@Controller('etiquetas')
export class EtiquetasController {
  constructor(private readonly etiquetasService: EtiquetasService) {}

  // ---- Rotas autenticadas por DISPOSITIVO (padronizado com DispositivoGuard) ----
  // @Public() faz o JwtAuthGuard global ignorar; DispositivoGuard assume a autenticação.

  @Public()
  @UseGuards(DispositivoGuard)
  @Post()
  criar(@Body() dto: CriarEtiquetaDto, @CurrentDevice() dispositivo: AuthenticatedDevice) {
    return this.etiquetasService.criar(dto, dispositivo);
  }

  @Public()
  @UseGuards(DispositivoGuard)
  @Post(':id/reimprimir')
  reimprimir(
    @Param('id') id: string,
    @Body() dto: ReimprimirEtiquetaDto,
    @CurrentDevice() dispositivo: AuthenticatedDevice,
  ) {
    return this.etiquetasService.reimprimir(id, dto, dispositivo);
  }

  @Public()
  @UseGuards(DispositivoGuard)
  @Patch(':id/status')
  atualizarStatus(
    @Param('id') id: string,
    @Body() dto: AtualizarStatusEtiquetaDto,
    @CurrentDevice() dispositivo: AuthenticatedDevice,
  ) {
    return this.etiquetasService.atualizarStatus(id, dto, dispositivo);
  }

  // ---- Rota PÚBLICA de consulta via QR — sem device, sem login ----
  // Precisa vir ANTES de ':id' para não colidir com a rota de gestão.
  // Responde HTML quando o Accept indica navegador (ex.: escaneou o QR
  // e abriu a câmera/app padrão), e JSON quando é chamada programática
  // (ex.: app Flutter, fetch de uma futura tela de detalhes).
  @Public()
  @Get('consulta/:id')
  async consultaPublica(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const dados = await this.etiquetasService.consultaPublica(id);

    const aceitaHtml = (req.headers.accept ?? '').includes('text/html');
    if (!aceitaHtml) {
      return res.status(200).json(dados);
    }

    return res.status(200).type('html').send(this.renderHtml(dados));
  }

  private renderHtml(dados: {
    produto: string;
    alergenos: string[];
    condicao: string;
    lote: string | null;
    dataManipulacao: Date;
    dataValidade: Date;
    status: string;
    responsavel: string;
  }): string {
    const fmt = (d: Date) =>
      new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    const statusCor =
      dados.status === 'VALIDA'
        ? '#16a34a'
        : dados.status === 'VENCIDA'
        ? '#dc2626'
        : '#6b7280';

    const alergenosHtml = dados.alergenos.length
      ? `<p><strong>Alérgenos:</strong> ${dados.alergenos.join(', ')}</p>`
      : '';

    // Escapa valores simples para evitar XSS via dados vindos do banco
    const esc = (s: string) =>
      s.replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
      );

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Consulta de Etiqueta — Chef-Sys</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background:#f3f4f6; margin:0; padding:24px; }
    .card { max-width:420px; margin:0 auto; background:#fff; border-radius:12px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    h1 { font-size:20px; margin:0 0 4px; }
    .status { display:inline-block; padding:4px 12px; border-radius:999px; color:#fff; font-size:13px; font-weight:600; margin-bottom:16px; }
    p { margin:6px 0; color:#374151; font-size:15px; }
    strong { color:#111827; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${esc(dados.produto)}</h1>
    <span class="status" style="background:${statusCor}">${esc(dados.status)}</span>
    <p><strong>Condição:</strong> ${esc(dados.condicao)}</p>
    ${dados.lote ? `<p><strong>Lote:</strong> ${esc(dados.lote)}</p>` : ''}
    <p><strong>Manipulado em:</strong> ${fmt(dados.dataManipulacao)}</p>
    <p><strong>Validade:</strong> ${fmt(dados.dataValidade)}</p>
    <p><strong>Responsável:</strong> ${esc(dados.responsavel)}</p>
    ${alergenosHtml}
  </div>
</body>
</html>`;
  }

  // ---- Rotas autenticadas por USUÁRIO (JWT global) — AUDITOR bloqueado ----

  @Roles(PapelUsuario.ADMIN, PapelUsuario.EMISSOR)
  @UseGuards(RolesGuard)
  @Get()
  listar(@Query() filtros: ListarEtiquetasDto, @CurrentUser() usuario: AuthenticatedUser) {
    return this.etiquetasService.listar(usuario.unidadeId, filtros);
  }

  // 🆕 Histórico de reimpressões — precisa vir antes de ':id' para o roteamento
  // funcionar corretamente (evita conflito de rota estática vs. dinâmica).
  @Roles(PapelUsuario.ADMIN, PapelUsuario.EMISSOR)
  @UseGuards(RolesGuard)
  @Get(':id/reimpressoes')
  listarReimpressoes(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.etiquetasService.listarHistoricoReimpressoes(id, usuario.unidadeId);
  }

  @Roles(PapelUsuario.ADMIN, PapelUsuario.EMISSOR)
  @UseGuards(RolesGuard)
  @Get(':id')
  buscarPorId(@Param('id') id: string, @CurrentUser() usuario: AuthenticatedUser) {
    return this.etiquetasService.buscarPorId(id, usuario.unidadeId);
  }
}
