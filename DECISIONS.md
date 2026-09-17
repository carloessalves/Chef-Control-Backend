# Decisões Técnicas — Chef-Sys Backend

Este documento registra decisões de arquitetura, dívidas técnicas conscientes
e ressalvas de compatibilidade que não são óbvias apenas lendo o código.

---

## [2026-09-13] Override de peer dependency — @nestjs/throttler

**Contexto:** O projeto usa `@nestjs/core@^12.0.1`, mas o `@nestjs/throttler@6.5.0`
(versão mais recente disponível) declara suporte oficial apenas até `@nestjs/core@^11.0.0`
em seu `peerDependencies`. Isso gerava erro `ELSPROBLEMS`/`invalid` no `npm install`.

**Decisão:** Adicionar `overrides` no `package.json` para forçar a resolução do
`@nestjs/throttler` a aceitar a versão real do `@nestjs/common`/`@nestjs/core`
usada no projeto:

\```json
"overrides": {
  "@nestjs/throttler": {
    "@nestjs/common": "$@nestjs/common",
    "@nestjs/core": "$@nestjs/core"
  }
}
\```

**Justificativa:** A API interna do Nest usada pelo throttler (Guards, Reflector,
injeção de dependência) não teve breaking changes relevantes entre v11 e v12.
O conflito é apenas de declaração de peer dependency, não de funcionamento real.

**Risco assumido:** Caso uma futura versão do Nest v12.x introduza mudança
incompatível na API de Guards/Reflector, o throttler pode falhar silenciosamente
sem que o npm avise (já que o override suprime a validação).

**Ação de acompanhamento:** Revisar periodicamente o changelog oficial em
https://github.com/nestjs/throttler — remover o override quando uma versão
declarar suporte oficial a `@nestjs/core@^12`.

---
---

## [2026-09-13] Nome de dispositivo único por unidade (apenas entre ativos)

**Contexto:** O modelo `Dispositivo` permitia múltiplos dispositivos com o mesmo
`nome` dentro da mesma `unidadeId`, causando confusão operacional para o ADMIN
ao gerenciar tablets/dispositivos (ex: dois dispositivos chamados "Cozinha").

**Decisão:** Adicionar uma constraint de unicidade composta (`unidadeId`, `nome`),
mas restrita apenas a dispositivos **ativos** (`ativo = true`). Como o modelo usa
soft delete (`remove()` apenas desativa, nunca apaga), uma constraint única
tradicional bloquearia permanentemente o reuso de nomes por dispositivos
desativados — por isso foi necessário um **índice único parcial**, criado via
SQL raw na migration (não representável nativamente pela sintaxe `@@unique` do
Prisma):

\```sql
CREATE UNIQUE INDEX "dispositivos_unidadeId_nome_ativo_unique"
ON "dispositivos" ("unidadeId", "nome")
WHERE "ativo" = true;
\```

**Defesa em profundidade:** Além do índice no banco (proteção real contra race
condition, como já resolvido no item #7 para Categorias), foi adicionada uma
verificação prévia (`verificarNomeDuplicado`) no `DispositivosService`, chamada
em `vincular()` (criação e renovação) e em `update()`. Isso garante uma resposta
`409 ConflictException` com mensagem amigável, evitando que o usuário veja um
erro cru de violação de constraint do Postgres.

**Arquivos alterados:**
- `prisma/schema.prisma` (comentário documentando o índice raw)
- `prisma/migrations/..._dispositivo_nome_unico_por_unidade/migration.sql`
- `src/dispositivos/dispositivos.service.ts`

**Observação:** O Prisma Client não tem conhecimento nativo desse índice (por
ser SQL raw), então qualquer nova rota que crie/atualize `nome` de dispositivo
deve chamar `verificarNomeDuplicado()` manualmente — o índice do banco é a
última linha de defesa, não a primeira.

---
