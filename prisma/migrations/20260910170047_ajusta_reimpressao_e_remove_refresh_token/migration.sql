/*
  Warnings:

  - You are about to drop the column `reimpressaoDe` on the `etiquetas` table. All the data in the column will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_usuarioId_fkey";

-- AlterTable
ALTER TABLE "etiquetas" DROP COLUMN "reimpressaoDe",
ADD COLUMN     "reimpressaoDeId" UUID;

-- DropTable
DROP TABLE "refresh_tokens";

-- CreateIndex
CREATE INDEX "etiquetas_reimpressaoDeId_idx" ON "etiquetas"("reimpressaoDeId");

-- AddForeignKey
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_reimpressaoDeId_fkey" FOREIGN KEY ("reimpressaoDeId") REFERENCES "etiquetas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
