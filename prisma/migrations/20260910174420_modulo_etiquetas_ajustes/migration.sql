/*
  Warnings:

  - You are about to drop the column `reimpressaoDeId` on the `etiquetas` table. All the data in the column will be lost.
  - Made the column `emissorId` on table `etiquetas` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dispositivoId` on table `etiquetas` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "etiquetas" DROP CONSTRAINT "etiquetas_dispositivoId_fkey";

-- DropForeignKey
ALTER TABLE "etiquetas" DROP CONSTRAINT "etiquetas_emissorId_fkey";

-- DropForeignKey
ALTER TABLE "etiquetas" DROP CONSTRAINT "etiquetas_reimpressaoDeId_fkey";

-- DropIndex
DROP INDEX "etiquetas_reimpressaoDeId_idx";

-- AlterTable
ALTER TABLE "etiquetas" DROP COLUMN "reimpressaoDeId",
ADD COLUMN     "motivoDescarte" TEXT,
ALTER COLUMN "emissorId" SET NOT NULL,
ALTER COLUMN "dispositivoId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_emissorId_fkey" FOREIGN KEY ("emissorId") REFERENCES "emissores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "dispositivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
