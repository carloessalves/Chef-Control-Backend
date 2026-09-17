-- CreateEnum
CREATE TYPE "EntidadeAuditoria" AS ENUM ('Usuario', 'Emissor', 'Unidade', 'CategoriaProduto', 'ProdutoManipulado', 'RegraValidade', 'Dispositivo', 'Etiqueta');

-- AlterTable (converte os dados existentes em vez de apagar)
ALTER TABLE "eventos_auditoria"
  ALTER COLUMN "entidade" TYPE "EntidadeAuditoria"
  USING ("entidade"::text::"EntidadeAuditoria");
