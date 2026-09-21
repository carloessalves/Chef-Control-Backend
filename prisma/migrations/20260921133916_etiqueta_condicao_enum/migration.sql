/*
  Warnings:

  - Changed the type of `condicao` on the `etiquetas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "etiquetas"
  ALTER COLUMN "condicao" TYPE "CondicaoArmazenamento"
  USING "condicao"::"CondicaoArmazenamento";

