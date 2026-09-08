-- CreateEnum
CREATE TYPE "StatusMesa" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('OPEN', 'IN_KITCHEN', 'READY', 'DELIVERED', 'CANCELED', 'CLOSED');

-- CreateEnum
CREATE TYPE "StatusItemPedido" AS ENUM ('PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('CASH', 'CREDIT', 'DEBIT', 'PIX');

-- CreateEnum
CREATE TYPE "NomePerfil" AS ENUM ('ADMIN', 'MANAGER', 'CHEF', 'WAITER', 'CASHIER');

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "categoriaId" UUID NOT NULL,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesas" (
    "id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "status" "StatusMesa" NOT NULL DEFAULT 'AVAILABLE',
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" UUID NOT NULL,
    "mesaId" UUID,
    "usuarioId" UUID NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'OPEN',
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL,
    "fechadoEm" TIMESTAMPTZ(6),

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" UUID NOT NULL,
    "pedidoId" UUID NOT NULL,
    "produtoId" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DECIMAL NOT NULL,
    "status" "StatusItemPedido" NOT NULL DEFAULT 'PENDING',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" UUID NOT NULL,
    "pedidoId" UUID NOT NULL,
    "forma" "FormaPagamento" NOT NULL,
    "valor" DECIMAL NOT NULL,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis" (
    "id" UUID NOT NULL,
    "nome" "NomePerfil" NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissoes" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_permissoes" (
    "perfilId" UUID NOT NULL,
    "permissaoId" UUID NOT NULL,

    CONSTRAINT "perfil_permissoes_pkey" PRIMARY KEY ("perfilId","permissaoId")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "perfilId" UUID NOT NULL,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "metadados" JSON,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE INDEX "produtos_categoriaId_idx_63b46427" ON "produtos"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_numero_key" ON "mesas"("numero");

-- CreateIndex
CREATE INDEX "pedidos_mesaId_idx_81c645f6" ON "pedidos"("mesaId");

-- CreateIndex
CREATE INDEX "pedidos_status_idx_e98638ab" ON "pedidos"("status");

-- CreateIndex
CREATE INDEX "pedidos_usuarioId_idx_5f01c7d6" ON "pedidos"("usuarioId");

-- CreateIndex
CREATE INDEX "itens_pedido_pedidoId_idx_4742647d" ON "itens_pedido"("pedidoId");

-- CreateIndex
CREATE INDEX "itens_pedido_produtoId_idx_eb62fdb9" ON "itens_pedido"("produtoId");

-- CreateIndex
CREATE INDEX "pagamentos_pedidoId_idx_4742647d" ON "pagamentos"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_nome_key" ON "perfis"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_nome_key" ON "permissoes"("nome");

-- CreateIndex
CREATE INDEX "perfil_permissoes_perfilId_idx_18f1fe5e" ON "perfil_permissoes"("perfilId");

-- CreateIndex
CREATE INDEX "perfil_permissoes_permissaoId_idx_32efd59e" ON "perfil_permissoes"("permissaoId");

-- CreateIndex
CREATE INDEX "usuarios_perfilId_idx_18f1fe5e" ON "usuarios"("perfilId");

-- CreateIndex
CREATE INDEX "logs_auditoria_entidade_entidadeId_idx_8ba55fde" ON "logs_auditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "logs_auditoria_usuarioId_idx_5f01c7d6" ON "logs_auditoria"("usuarioId");

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "perfil_permissoes" ADD CONSTRAINT "perfil_permissoes_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfis"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "perfil_permissoes" ADD CONSTRAINT "perfil_permissoes_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissoes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfis"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
