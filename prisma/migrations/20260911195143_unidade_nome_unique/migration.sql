/*
  Warnings:

  - A unique constraint covering the columns `[nome]` on the table `unidades` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "unidades_nome_key" ON "unidades"("nome");
