/*
  Warnings:

  - You are about to drop the column `sincronizadoEm` on the `etiquetas` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioGestaoId` on the `etiquetas` table. All the data in the column will be lost.
  - Added the required column `atualizadoEm` to the `etiquetas` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `condicao` on the `etiquetas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "etiquetas" DROP CONSTRAINT "etiquetas_usuarioGestaoId_fkey";

-- DropIndex
DROP INDEX "etiquetas_dataValidade_idx";

-- DropIndex
DROP INDEX "etiquetas_produtoId_idx";

-- DropIndex
DROP INDEX "etiquetas_status_idx";

-- DropIndex
DROP INDEX "etiquetas_unidadeId_idx";

-- AlterTable
ALTER TABLE "etiquetas" DROP COLUMN "sincronizadoEm",
DROP COLUMN "usuarioGestaoId",
ADD COLUMN     "atualizadoEm" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "emissorUsuarioId" UUID,
DROP COLUMN "condicao",
ADD COLUMN     "condicao" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "historico_reimpressoes" (
    "id" UUID NOT NULL,
    "etiquetaId" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "dispositivoId" UUID NOT NULL,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_reimpressoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historico_reimpressoes_etiquetaId_idx" ON "historico_reimpressoes"("etiquetaId");

-- AddForeignKey
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_emissorUsuarioId_fkey" FOREIGN KEY ("emissorUsuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_reimpressoes" ADD CONSTRAINT "historico_reimpressoes_etiquetaId_fkey" FOREIGN KEY ("etiquetaId") REFERENCES "etiquetas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_reimpressoes" ADD CONSTRAINT "historico_reimpressoes_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "dispositivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
