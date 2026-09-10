-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN', 'EMISSOR', 'AUDITOR');

-- CreateEnum
CREATE TYPE "CondicaoArmazenamento" AS ENUM ('AMBIENTE', 'RESFRIADO', 'CONGELADO');

-- CreateEnum
CREATE TYPE "StatusEtiqueta" AS ENUM ('VALIDA', 'VENCIDA', 'DESCARTADA');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'EMIT', 'REPRINT', 'LOGIN');

-- CreateTable
CREATE TABLE "unidades" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "funcao" TEXT,
    "papel" "PapelUsuario" NOT NULL,
    "pin" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "unidadeId" UUID NOT NULL,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emissores" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "funcao" TEXT NOT NULL,
    "unidadeId" UUID NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emissores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_produto" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorias_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos_manipulados" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "categoriaId" UUID,
    "alergenos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "unidadeId" UUID NOT NULL,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produtos_manipulados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_validade" (
    "id" UUID NOT NULL,
    "produtoId" UUID NOT NULL,
    "condicao" "CondicaoArmazenamento" NOT NULL,
    "horasValidade" INTEGER NOT NULL,

    CONSTRAINT "regras_validade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositivos" (
    "id" UUID NOT NULL,
    "identificador" TEXT NOT NULL,
    "nome" TEXT,
    "unidadeId" UUID NOT NULL,
    "ultimoAcesso" TIMESTAMPTZ(6),
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispositivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etiquetas" (
    "id" UUID NOT NULL,
    "produtoId" UUID NOT NULL,
    "emissorId" UUID,
    "usuarioGestaoId" UUID,
    "unidadeId" UUID NOT NULL,
    "dispositivoId" UUID,
    "condicao" "CondicaoArmazenamento" NOT NULL,
    "lote" TEXT,
    "dataManipulacao" TIMESTAMPTZ(6) NOT NULL,
    "dataValidade" TIMESTAMPTZ(6) NOT NULL,
    "status" "StatusEtiqueta" NOT NULL DEFAULT 'VALIDA',
    "motivoReimpressao" TEXT,
    "reimpressaoDe" UUID,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sincronizadoEm" TIMESTAMPTZ(6),

    CONSTRAINT "etiquetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_auditoria" (
    "id" UUID NOT NULL,
    "usuarioId" UUID,
    "papelNoMomento" "PapelUsuario",
    "tipoEvento" "TipoEvento" NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "dispositivoId" UUID,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usuarios_unidadeId_idx" ON "usuarios"("unidadeId");

-- CreateIndex
CREATE INDEX "emissores_unidadeId_idx" ON "emissores"("unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_produto_nome_key" ON "categorias_produto"("nome");

-- CreateIndex
CREATE INDEX "produtos_manipulados_unidadeId_idx" ON "produtos_manipulados"("unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "regras_validade_produtoId_condicao_key" ON "regras_validade"("produtoId", "condicao");

-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_identificador_key" ON "dispositivos"("identificador");

-- CreateIndex
CREATE INDEX "dispositivos_unidadeId_idx" ON "dispositivos"("unidadeId");

-- CreateIndex
CREATE INDEX "etiquetas_produtoId_idx" ON "etiquetas"("produtoId");

-- CreateIndex
CREATE INDEX "etiquetas_unidadeId_idx" ON "etiquetas"("unidadeId");

-- CreateIndex
CREATE INDEX "etiquetas_status_idx" ON "etiquetas"("status");

-- CreateIndex
CREATE INDEX "etiquetas_dataValidade_idx" ON "etiquetas"("dataValidade");

-- CreateIndex
CREATE INDEX "eventos_auditoria_entidade_entidadeId_idx" ON "eventos_auditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "eventos_auditoria_usuarioId_idx" ON "eventos_auditoria"("usuarioId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissores" ADD CONSTRAINT "emissores_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos_manipulados" ADD CONSTRAINT "produtos_manipulados_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos_manipulados" ADD CONSTRAINT "produtos_manipulados_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_validade" ADD CONSTRAINT "regras_validade_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos_manipulados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispositivos" ADD CONSTRAINT "dispositivos_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos_manipulados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_emissorId_fkey" FOREIGN KEY ("emissorId") REFERENCES "emissores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_usuarioGestaoId_fkey" FOREIGN KEY ("usuarioGestaoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "dispositivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_auditoria" ADD CONSTRAINT "eventos_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
