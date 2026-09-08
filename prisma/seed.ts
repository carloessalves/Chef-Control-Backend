import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Permissões
  const permissoes = await Promise.all(
    ['gerenciar_pedidos', 'gerenciar_produtos', 'gerenciar_usuarios', 'visualizar_relatorios'].map((nome) =>
      prisma.permissao.create({
        data: { id: randomUUID(), nome, descricao: `Permissão para ${nome.replace('_', ' ')}` },
      })
    )
  );

  // Perfis
  const perfilAdmin = await prisma.perfil.create({
    data: {
      id: randomUUID(),
      nome: 'ADMIN',
      descricao: 'Administrador do sistema',
      atualizadoEm: new Date(),
      perfilPermissoes: {
        create: permissoes.map((p) => ({ permissaoId: p.id })),
      },
    },
  });

  const perfilWaiter = await prisma.perfil.create({
    data: { id: randomUUID(), nome: 'WAITER', descricao: 'Garçom', atualizadoEm: new Date() },
  });

  const perfilChef = await prisma.perfil.create({
    data: { id: randomUUID(), nome: 'CHEF', descricao: 'Cozinheiro', atualizadoEm: new Date() },
  });

  // Usuários — PINs com hash bcrypt
  const pinAdminHash = await bcrypt.hash('1234', 10);
  const pinGarcomHash = await bcrypt.hash('5678', 10);

  const admin = await prisma.usuario.create({
    data: {
      id: randomUUID(),
      nome: 'Renato Admin',
      pin: pinAdminHash,
      perfilId: perfilAdmin.id,
      atualizadoEm: new Date(),
    },
  });

  const garcom = await prisma.usuario.create({
    data: {
      id: randomUUID(),
      nome: 'João Garçom',
      pin: pinGarcomHash,
      perfilId: perfilWaiter.id,
      atualizadoEm: new Date(),
    },
  });

  // Categorias
  const categoriaBebidas = await prisma.categoria.create({
    data: { id: randomUUID(), nome: 'Bebidas', atualizadoEm: new Date() },
  });

  const categoriaPratos = await prisma.categoria.create({
    data: { id: randomUUID(), nome: 'Pratos Principais', atualizadoEm: new Date() },
  });

  // Produtos
  const suco = await prisma.produto.create({
    data: {
      id: randomUUID(),
      nome: 'Suco de Laranja',
      descricao: 'Suco natural 300ml',
      preco: 8.5,
      categoriaId: categoriaBebidas.id,
      atualizadoEm: new Date(),
    },
  });

  const feijoada = await prisma.produto.create({
    data: {
      id: randomUUID(),
      nome: 'Feijoada Completa',
      descricao: 'Feijoada com acompanhamentos',
      preco: 35.9,
      categoriaId: categoriaPratos.id,
      atualizadoEm: new Date(),
    },
  });

  // Mesas
  const mesa1 = await prisma.mesa.create({
    data: { id: randomUUID(), numero: 1, atualizadoEm: new Date() },
  });

  await prisma.mesa.create({
    data: { id: randomUUID(), numero: 2, atualizadoEm: new Date() },
  });

  // Pedido de teste
  const pedido = await prisma.pedido.create({
    data: {
      id: randomUUID(),
      mesaId: mesa1.id,
      usuarioId: garcom.id,
      atualizadoEm: new Date(),
      itens: {
        create: [
          {
            id: randomUUID(),
            produtoId: feijoada.id,
            quantidade: 1,
            precoUnitario: feijoada.preco,
            atualizadoEm: new Date(),
          },
          {
            id: randomUUID(),
            produtoId: suco.id,
            quantidade: 2,
            precoUnitario: suco.preco,
            atualizadoEm: new Date(),
          },
        ],
      },
    },
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log({ admin: admin.nome, garcom: garcom.nome, pedido: pedido.id });
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
