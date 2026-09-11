/*
  Warnings:

  - The values [CONSUMIDO] on the enum `StatusEtiqueta` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatusEtiqueta_new" AS ENUM ('VALIDA', 'VENCIDA', 'DESCARTADA', 'CONSUMIDA');
ALTER TABLE "etiquetas" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "etiquetas" ALTER COLUMN "status" TYPE "StatusEtiqueta_new" USING ("status"::text::"StatusEtiqueta_new");
ALTER TYPE "StatusEtiqueta" RENAME TO "StatusEtiqueta_old";
ALTER TYPE "StatusEtiqueta_new" RENAME TO "StatusEtiqueta";
DROP TYPE "StatusEtiqueta_old";
ALTER TABLE "etiquetas" ALTER COLUMN "status" SET DEFAULT 'VALIDA';
COMMIT;
