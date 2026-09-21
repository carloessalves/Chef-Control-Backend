# Documentação de Arquitetura — Sistema de Gestão de Etiquetas

> **Última atualização:** 21/09/2026 — Padronização de `EntidadeAuditoria` em `EtiquetasService` (commit pós-implementação da SyncOutbox para Emissor/Etiqueta).

## 1. Visão Geral

- Backend em **NestJS** + **Prisma ORM** + **PostgreSQL**.
- Arquitetura multi-tenant por **Unidade** (filial/loja), com isolamento de dados via `unidadeId` na maioria das entidades operacionais.
- Suporta dois modos de operação, controlados pela variável de ambiente `SERVER_MODE`:
    - **`local`**: instância roda na própria unidade (ex: tablet/servidor local), pode operar offline e sincroniza depois com a nuvem via `SyncOutbox`.
    - **`cloud`**: instância agregadora central; tabela `SyncOutbox` existe mas permanece vazia.
- Dois canais de identidade coexistem em cada requisição:
    - **Usuário autenticado** (JWT) — pessoa (ADMIN, EMISSOR, AUDITOR).
    - **Dispositivo vinculado** (header `x-device-id`) — tablet/terminal físico da unidade.

---

## 2. Autenticação e Autorização

### 2.1. Guards Globais (`APP_GUARD`)

1. **`ThrottlerGuard`** — rate limiting.
2. **`JwtAuthGuard`** — valida o Bearer token, exceto se a rota tiver `@Public()`.
3. **`RolesGuard`** — valida `user.papel` contra `@Roles(...)`, exceto se não houver `@Roles()` definido.

> A ordem garante que toda rota exige autenticação por padrão, com exceções explícitas via decorators.

### 2.2. `JwtStrategy` — validação e revalidação

- Extrai o token via `Authorization: Bearer <token>`.
- **Revalida o usuário contra o banco em toda requisição**:
    - Usuário inexistente/inativo → `401`.
    - `papel`/`unidadeId` do banco diferentes do payload → `401` ("Sessão expirada devido a alteração de permissões").
- Evita que um token antigo continue válido após ADMIN alterar papel/unidade/desativar o usuário.

### 2.3. Decorators de Auth

| Decorator | Metadata Key | Efeito |
|---|---|---|
| `@Public()` | `isPublic` | Libera sem exigir token |
| `@Roles(...papeis)` | `roles` | Restringe por papel; vazio/ausente = qualquer autenticado |
| `@OptionalDevice()` | `isDeviceOptional` | Tolera ausência de dispositivo vinculado |
| `@CurrentUser()` | — | Injeta `request.user` |
| `@CurrentDevice()` | — | Injeta `request.dispositivo` |

### 2.4. `DispositivoGuard` — autenticação por dispositivo físico

Fluxo (aplicado em `EtiquetasController`, `EmissoresController`, etc.):

1. Lê o header `x-device-id` (UUID v4 gerado localmente no primeiro boot do app).
2. **Header ausente**: libera se `@OptionalDevice()`, senão `401`.
3. Busca o `Dispositivo` no banco por `identificador`.
4. **Não encontrado**: libera se opcional, senão `401`.
5. **Dispositivo ou Unidade inativos** → `401` **sempre**, mesmo em rota opcional.
    > "Opcional" cobre a ausência de vínculo, não a invalidade de um vínculo existente.
6. Atualiza `ultimoAcesso` fire-and-forget (não bloqueia, falha silenciosa).
7. Popula `request.dispositivo` (com `unidade`) para uso posterior.

### 2.5. Fluxos de vínculo de dispositivo

- **`VincularDispositivoDto`**: vínculo simples (`identificador` + `nome` opcional).
- **`VincularComLoginDto`**: vínculo com bootstrap de credenciais ADMIN (`identificador`, `nomeDispositivo`, `nomeUsuario`, `pin`) — primeiro pareamento do tablet, sem JWT ainda; rota usa `@Roles()` vazio.

### 2.6. Login e PIN

- **`LoginDto`**: `nomeUsuario` + `pin` (4 dígitos, `^\d{4}$`).
- **`AtualizarProprioPinDto`**: self-service, `pinAtual` + `novoPin` (4 dígitos) — rota `PATCH /usuarios/me/pin`, posicionada **antes** de `PATCH /usuarios/:id`.
- PIN único **por unidade** (`@@unique([unidadeId, pin])`).


---

## 3. Matriz de Controle de Acesso (RBAC)

| Recurso | ADMIN | EMISSOR | AUDITOR |
|---|---|---|---|
| Usuários | CRUD completo | ❌ | leitura |
| Unidades | CRUD completo | ❌ | ❌ |
| Dispositivos | CRUD completo | ❌ | ❌ |
| Auditoria | leitura | ❌ | leitura |
| Etiquetas | leitura/listagem | leitura/listagem/emissão | ❌ |
| Regras de validade | leitura + escrita | ❌ | leitura |
| Categorias de produto | CRUD | leitura | leitura |
| Produtos manipulados | CRUD | ❌ | ❌ |

---

## 4. Tratamento Global de Erros — `AllExceptionsFilter`

- `@Catch()` captura todas as exceções.
- Resposta padronizada ao cliente (exemplo):

        {
          "statusCode": 404,
          "message": "Registro não encontrado.",
          "error": "Not Found",
          "timestamp": "2026-09-21T12:00:00.000Z",
          "path": "/usuarios/abc"
        }

- Mapeamento de erros do Prisma:

    | Código Prisma | HTTP Status | Situação |
    |---|---|---|
    | `P2002` | 409 Conflict | Unique constraint violada |
    | `P2003` | 400 Bad Request | Foreign key inválida |
    | `P2025` | 404 Not Found | Registro não encontrado |
    | outros | 400 Bad Request | Fallback genérico |

- `PrismaClientValidationError` → 400.
- Erro não mapeado → 500 ("Erro interno do servidor").
- **Segurança**: stack traces nunca chegam ao cliente — só logados no servidor (`error` para 5xx, `warn` para 4xx).

---

## 5. Modelo de Dados (Prisma Schema)

### 5.1. Enums

- `PapelUsuario`: `ADMIN`, `EMISSOR`, `AUDITOR`
- `CondicaoArmazenamento`: `AMBIENTE`, `RESFRIADO`, `CONGELADO`
- `StatusEtiqueta`: `VALIDA`, `VENCIDA`, `DESCARTADA`, `CONSUMIDA`
- `TipoEvento`: `CREATE`, `UPDATE`, `DELETE`, `EMIT`, `REPRINT`, `LOGIN`
- `EntidadeAuditoria`: `Usuario`, `Emissor`, `Unidade`, `CategoriaProduto`, `ProdutoManipulado`, `RegraValidade`, `Dispositivo`, `Etiqueta`
- `SyncOutboxStatus`: `PENDENTE`, `ENVIADO`, `ERRO_PERMANENTE`
- `SyncOutboxTipo`: `CRIAR_ETIQUETA`, `ATUALIZAR_ETIQUETA`, `CRIAR_PRODUTO`, `ATUALIZAR_PRODUTO`, `CRIAR_EMISSOR`, `ATUALIZAR_EMISSOR`

### 5.2. Entidades principais

**`Unidade`**
- Chave da multi-tenancy. `nome` único; `cnpj` único opcional (validado por algoritmo real de dígitos verificadores).
- Relaciona-se a `Usuario`, `Emissor`, `ProdutoManipulado`, `Etiqueta`, `Dispositivo`.

**`Usuario`**
- `nome` único globalmente; `pin` único **por unidade**.
- `papel` define permissões via RBAC.
- Relaciona-se a `EventoAuditoria` e `Etiqueta` (via `emissorUsuarioId`, relação `EmissorGestao`).

**`Emissor`**
- Pessoa física que manipula/emite etiquetas — **distinto de `Usuario`**, sem login/PIN próprio.
- `id` pode ser gerado no client (offline-first).
- `unidadeId` vem do `req.dispositivo.unidadeId`, nunca do body.

**`CategoriaProduto` / `ProdutoManipulado`**
- Produto tem `alergenos: String[]`, `categoriaId` opcional, escopado por `unidadeId`.

**`RegraValidade`**
- `condicao` (enum) único → `horasValidade`. Provável seed fixo (3 registros); sem endpoint de criação.

**`Dispositivo`**
- `identificador` único (UUID v4 gerado no client).
- Índice único parcial `(unidadeId, nome) WHERE ativo = true` via migration SQL raw.
- `ultimoAcesso` atualizado a cada requisição validada pelo guard.

**`Etiqueta`**
- Entidade central. Vincula `produto`, `emissor`, `unidade`, `dispositivo`, e opcionalmente `emissorUsuario`.
- `condicao` é `String` no schema, mas validada como enum no DTO — inconsistência a esclarecer.
- `dataValidade` é snapshot calculado na criação; mudanças futuras em `RegraValidade` não afetam etiquetas já emitidas.
- `status` transiciona só para `CONSUMIDA`/`DESCARTADA`.
- `motivoDescarte` obrigatório apenas se `status = DESCARTADA`.
- `id` pode ser gerado no client (idempotência offline).

**`HistoricoReimpressao`**
- Registra reimpressões, `motivo` obrigatório (mín. 5 caracteres), `dispositivo` solicitante.

**`EventoAuditoria`**
- `dadosAntes`/`dadosDepois` em `JsonB` (snapshot completo).
- `papelNoMomento` congela o papel no instante do evento.
- `usuarioId` opcional (eventos de dispositivo).

**`SyncOutbox`**
- Fila local → cloud, ativa só quando `SERVER_MODE=local`.
- Cobre `CRIAR_ETIQUETA`, `ATUALIZAR_ETIQUETA`, `CRIAR_PRODUTO`, `ATUALIZAR_PRODUTO`, `CRIAR_EMISSOR`, `ATUALIZAR_EMISSOR`.
- Sem sync para entidades administrativas/configuração (`Usuario`, `Unidade`, `RegraValidade`, `Dispositivo`, `CategoriaProduto`) — decisão intencional (ver seção 15).
- Retry via `tentativas`, `proximaTentativaEm`, `status`, `erro`.

---

## 6. Fluxo Offline-First / Sincronização

- `SERVER_MODE` obrigatório via env — falha ao iniciar se ausente/inválido.
- Em modo `local`:
    1. Services relevantes criam registros no Postgres local **e** enfileiram em `SyncOutbox`.
    2. Worker (não recebido ainda) consome a fila e envia ao backend cloud.
    3. IDs gerados no client garantem idempotência no reenvio.
- Em modo `cloud`: tabela existe mas fica sempre vazia.

---

## 7. Validadores Customizados

- **`IsCnpj`**: algoritmo oficial dos 2 dígitos verificadores (módulo 11), rejeita sequências repetidas. Usado em `CreateUnidadeDto` com `@Transform` prévio (strip de não-dígitos).

---

## 8. Pontos de Atenção / Inconsistências Identificadas

1. ~~**`AUDITOR` sem acesso a `GET /auditoria`** — contraditório com o nome do papel.~~
   ✅ **Resolvido**: `AuditoriaController.findAll` agora usa `@Roles(PapelUsuario.ADMIN, PapelUsuario.AUDITOR)`, liberando leitura de auditoria para o papel `AUDITOR`. Rota é somente leitura, sem risco de escrita indevida.
2. ~~**`Etiqueta.condicao` como `String`** vs. `@IsEnum` no DTO — falta constraint no banco.~~
   ✅ **Resolvido**: campo alterado para `CondicaoArmazenamento` (enum) diretamente no schema Prisma, eliminando a dependência exclusiva da validação em nível de DTO. Constraint agora garantida no banco.
3. ~~**Dois `update-regra-validade.dto.ts` diferentes**~~
   ✅ **Resolvido**: mantida a versão explícita (`horasValidade: number` obrigatório, `@IsInt @Min(1)`). Versão que herdava de `CreateRegraValidadeDto` via `PartialType` foi removida — ela permitiria alterar `condicao`, que é a chave de identidade da regra e não deve ser editável em um update.
4. ~~**`SyncOutbox` sem cobertura para `Usuario`/`Dispositivo`/etc.**~~
   ✅ **Resolvido**: confirmado que cadastros de configuração (`Unidade`, `Usuario`, `Dispositivo`, `CategoriaProduto`, `RegraValidade`) são intencionalmente locais-apenas — cada unidade gerencia seu próprio cadastro, e o agregador cloud não precisa desses dados. Documentado na seção 15.
5. ~~**Atualizações de `Emissor` e mudanças de status de `Etiqueta` não sincronizavam**~~
   ✅ **Resolvido**: adicionados `ATUALIZAR_EMISSOR` e `ATUALIZAR_ETIQUETA` ao enum `SyncOutboxTipo`. Implementadas as chamadas de `enfileirar()` em `EmissoresService.update()`/`remove()` e em `EtiquetasService.reimprimir()`/`atualizarStatus()`. Detalhes na seção 15.
6. ~~**`EtiquetasService` usava string literal `'Etiqueta'` em vez do enum `EntidadeAuditoria.Etiqueta`** nas chamadas de `auditoria.registrar()` (em `criar()`, `reimprimir()` e `atualizarStatus()`), enquanto `EmissoresService` já usava o enum corretamente.~~
   ✅ **Resolvido**: padronizadas as 3 ocorrências para `EntidadeAuditoria.Etiqueta`, com o enum importado de `@prisma/client`. Elimina o risco de divergência silenciosa entre string literal e enum caso o valor do enum seja renomeado no futuro.

---

## 15. Sync Outbox — Sincronização Local → Cloud

### Status: ✅ Resolvido

### Contexto
O sistema opera em dois modos (`SERVER_MODE=local` | `cloud`). Em modo local,
operações relevantes são enfileiradas na tabela `sync_outbox` para posterior
envio ao backend cloud (agregador). Em modo cloud, o enfileiramento é sempre
no-op (`SyncOutboxService.enfileirar()` retorna sem gravar).

### Cobertura de entidades — decisão de arquitetura confirmada

**Locais-apenas (não sincronizam):**
- `Unidade`, `Usuario`, `Dispositivo`, `CategoriaProduto`, `RegraValidade`

Justificativa: são cadastros de configuração. Cada unidade local gerencia seu
próprio cadastro; o agregador cloud não precisa desses dados.

**Sincronizadas com o cloud (create + update):**
- `Emissor` — `CRIAR_EMISSOR`, `ATUALIZAR_EMISSOR` (inclui soft delete/inativação)
- `ProdutoManipulado` — `CRIAR_PRODUTO`, `ATUALIZAR_PRODUTO`
- `Etiqueta` — `CRIAR_ETIQUETA`, `ATUALIZAR_ETIQUETA` (cobre reimpressão,
  descarte e consumo — todo o ciclo de vida da etiqueta)

### Enum `SyncOutboxTipo` (atualizado)

    enum SyncOutboxTipo {
      CRIAR_ETIQUETA
      ATUALIZAR_ETIQUETA
      CRIAR_PRODUTO
      ATUALIZAR_PRODUTO
      CRIAR_EMISSOR
      ATUALIZAR_EMISSOR
    }

### Implementação — pontos de enfileiramento

| Service | Método | Tipo enfileirado |
|---|---|---|
| `EmissoresService` | `create()` | `CRIAR_EMISSOR` |
| `EmissoresService` | `update()` | `ATUALIZAR_EMISSOR` |
| `EmissoresService` | `remove()` (soft delete) | `ATUALIZAR_EMISSOR` |
| `EtiquetasService` | `criar()` | `CRIAR_ETIQUETA` |
| `EtiquetasService` | `reimprimir()` | `ATUALIZAR_ETIQUETA` |
| `EtiquetasService` | `atualizarStatus()` (descarte/consumo) | `ATUALIZAR_ETIQUETA` |
| `ProdutosManipuladosService` | create/update | `CRIAR_PRODUTO` / `ATUALIZAR_PRODUTO` |

Todos os enfileiramentos ocorrem **dentro da mesma transação Prisma** (`tx`) do
create/update da entidade original, garantindo atomicidade (nunca há gravação
parcial: ou entidade + outbox são gravados juntos, ou nenhum é).

### Módulos ajustados
`EmissoresModule` e `EtiquetasModule` passaram a importar `SyncOutboxModule`,
necessário para a injeção de `SyncOutboxService` nesses services.

### Migration
Alteração de enum requer migration:

    npx prisma migrate dev --name add_atualizar_emissor_etiqueta_sync

### Itens anteriormente pendentes (fechados)
- ~~Lacuna: `Usuario`/`Dispositivo`/etc. sem cobertura na outbox~~ →
  confirmado como decisão intencional (locais-apenas).
- ~~Lacuna: atualização de `Emissor` e mudanças de status de `Etiqueta`
  não sincronizavam~~ → implementado (`ATUALIZAR_EMISSOR`, `ATUALIZAR_ETIQUETA`).
- ~~Inconsistência: `EtiquetasService` usava `entidade: 'Etiqueta'` (string literal) em vez do enum `EntidadeAuditoria.Etiqueta`~~ →
  padronizado para uso do enum, alinhado com `EmissoresService`.
