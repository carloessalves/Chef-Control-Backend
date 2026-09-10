// prisma/seed.ts
// prisma/seed.ts
import { PrismaClient, PapelUsuario, CondicaoArmazenamento } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  // Regras de validade padrão (uma por condição de armazenamento)
  await prisma.regraValidade.createMany({
  data: [
    { condicao: CondicaoArmazenamento.RESFRIADO, horasValidade: 48 },
    { condicao: CondicaoArmazenamento.CONGELADO, horasValidade: 720 },
    { condicao: CondicaoArmazenamento.AMBIENTE, horasValidade: 24 },
  ],
  skipDuplicates: true,
});
  console.log('✅ Regras de validade padrão criadas');

  // Evita recriar o ADMIN se o seed for rodado mais de uma vez
  const adminExistente = await prisma.usuario.findFirst({
    where: { papel: PapelUsuario.ADMIN },
  });

  if (adminExistente) {
    console.log('⚠️  Já existe um usuário ADMIN. Seed abortado.');
    return;
  }

  // Cria a unidade matriz (ajuste o nome conforme necessário)
  const unidade = await prisma.unidade.create({
    data: {
      nome: 'Unidade Matriz',
    },
  });

  const pinPadrao = '123456'; // TROQUE o PIN após o primeiro login!
  const pinHash = await bcrypt.hash(pinPadrao, SALT_ROUNDS);

  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      funcao: 'Administrador do sistema',
      papel: PapelUsuario.ADMIN,
      pin: pinHash,
      unidadeId: unidade.id,
    },
  });

  console.log('✅ Unidade matriz criada:', unidade.id);
  console.log('✅ Usuário ADMIN criado:', admin.id);
  console.log(`   PIN inicial: ${pinPadrao} (troque assim que logar!)`);
}

main()
  .catch((e) => {
    console.error('Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
