/*
  Warnings:

  - A unique constraint covering the columns `[unidadeId,pin]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "usuarioId" UUID NOT NULL,
    "expiraEm" TIMESTAMPTZ(6) NOT NULL,
    "revogado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuarioId_idx" ON "refresh_tokens"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_unidadeId_pin_key" ON "usuarios"("unidadeId", "pin");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
