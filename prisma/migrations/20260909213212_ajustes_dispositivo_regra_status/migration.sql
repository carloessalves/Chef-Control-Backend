/*
  Warnings:

  - You are about to drop the column `produtoId` on the `regras_validade` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[condicao]` on the table `regras_validade` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "StatusEtiqueta" ADD VALUE 'CONSUMIDO';

-- DropForeignKey
ALTER TABLE "regras_validade" DROP CONSTRAINT "regras_validade_produtoId_fkey";

-- DropIndex
DROP INDEX "regras_validade_produtoId_condicao_key";

-- AlterTable
ALTER TABLE "dispositivos" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "regras_validade" DROP COLUMN "produtoId",
ADD COLUMN     "atualizadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "regras_validade_condicao_key" ON "regras_validade"("condicao");
