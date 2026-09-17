/*
  Warnings:

  - A unique constraint covering the columns `[cnpj]` on the table `unidades` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "unidades_cnpj_key" ON "unidades"("cnpj");
