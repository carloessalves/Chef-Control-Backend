/*
  Warnings:

  - You are about to drop the `regras_validade` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "regras_validade";

-- CreateTable
CREATE TABLE "RegraValidade" (
    "id" UUID NOT NULL,
    "condicao" "CondicaoArmazenamento" NOT NULL,
    "horasValidade" INTEGER NOT NULL,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegraValidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegraValidade_condicao_key" ON "RegraValidade"("condicao");
