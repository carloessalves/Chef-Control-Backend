-- CreateEnum
CREATE TYPE "SyncOutboxStatus" AS ENUM ('PENDENTE', 'ENVIADO', 'ERRO_PERMANENTE');

-- CreateEnum
CREATE TYPE "SyncOutboxTipo" AS ENUM ('CRIAR_ETIQUETA', 'CRIAR_PRODUTO', 'ATUALIZAR_PRODUTO', 'CRIAR_EMISSOR');

-- CreateTable
CREATE TABLE "sync_outbox" (
    "id" UUID NOT NULL,
    "tipo" "SyncOutboxTipo" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "SyncOutboxStatus" NOT NULL DEFAULT 'PENDENTE',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "proximaTentativaEm" TIMESTAMPTZ(6),
    "erro" TEXT,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_outbox_status_proximaTentativaEm_idx" ON "sync_outbox"("status", "proximaTentativaEm");
