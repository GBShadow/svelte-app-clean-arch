# CRUD de Categorias e Busca Agregada — Plano

Criado: 2026-08-27
Slug: 2026-08-27-crud-categorias
Spec: [docs/specs/2026-08-27-crud-categorias.md](./2026-08-27-crud-categorias.md)

> Este é o **COMO** (R1). Toda decisão de stack, arquivo, rota, coleção e campo vive aqui — nunca na spec.

## Resumo

A funcionalidade será implementada criando a coleção global `categories` no PocketBase via migration com relacionamentos para `todo_items`, `kanban_cards`, `poker_tasks`, `spec_documents` e `retro_cards`. A gestão centralizada e a visão agregada residirão nas rotas `/categories` e `/categories/[id]`, complementadas por seletores de categoria e filtros reativos locais em cada uma das 5 ferramentas com validação por schemas Zod e arquitetura Ports & Adapters.

## Contexto técnico

| Campo | Valor |
|-------|-------|
| Linguagem / versão | SvelteKit 2 + Svelte 5 Runes + TypeScript 5 |
| Dependências primárias | PocketBase JS SDK, Zod, Tailwind CSS, DaisyUI, Lucide Svelte |
| Armazenamento | PocketBase (nova coleção `categories` + campos `category` nas coleções existentes) |
| Testes | Vitest (unitário para schemas, domínio puro e stores) + Playwright (E2E) |
| Plataforma | `apps/runes` (web) |
| Metas de performance | Tempo de resposta de busca e mutações < 1s; consultas agregadas paralelas |
| Restrições | Desvinculação suave (cascadeDelete: false); autorização apenas para usuários autenticados |
| Escala | Suporte a dezenas de categorias e agregação indexada por `category` |

## Constitution Check

| Princípio MUST | Como esta feature cumpre | Evidência |
|----------------|--------------------------|-----------|
| **P-001** Domínio puro, mutação por form action | Validação de permissões e mutações via SvelteKit Form Actions em `+page.server.ts` e regras puras em `categoryAccess.ts` | `apps/runes/src/lib/domain/categoryAccess.ts`, `apps/runes/src/routes/categories/+page.server.ts` |
| **P-002** App ativo é `runes` | Toda a implementação de UI e rotas está concentrada exclusivamente em `apps/runes/` | `apps/runes/src/routes/categories/` |
| **P-003** TDD não-negociável | Testes unitários para schemas Zod (`categorySchemas.test.ts`) e domínio puro (`categoryAccess.test.ts`) precedem o código de produção | `apps/runes/src/lib/validation/categorySchemas.test.ts`, `apps/runes/src/lib/domain/categoryAccess.test.ts` |
| **P-004** Toda entrada é validada por schema | Criação, atualização e filtros validados com schemas Zod com mensagens em português | `apps/runes/src/lib/validation/categorySchemas.ts` |
| **P-005** Autorização no banco, por posse e por campo | Coleção `categories` com regras de list/view/create/update/delete exigindo `@request.auth.id != ''` | `pocketbase/pb_migrations/0024_create_categories_and_relations.js` |
| **P-006** Schema versionado e datado | Migration numerada e com rollback idempotente (`0024_create_categories_and_relations.js`) contendo autodate `created` e `updated` | `pocketbase/pb_migrations/0024_create_categories_and_relations.js` |
| **P-007** Sem diálogo nativo do navegador | Confirmações de exclusão e modais utilizam componentes DaisyUI/Svelte 5 sem `window.alert` ou `window.prompt` | `apps/runes/src/routes/categories/` |
| **P-008** `throw redirect()` fora de `try-catch` | Redirecionamentos de autenticação em `load` ou actions são executados fora de blocos `try/catch` genéricos | `apps/runes/src/routes/categories/+page.server.ts` |
| **P-012** Sem catch silencioso | Todos os blocos `catch` efetuam log estruturado e retornam `fail(400, ...)` ou `fail(500, ...)` | `apps/runes/src/routes/categories/+page.server.ts` |
| **P-013** `data-testid` em componentes | Todos os botões, seletores, inputs e badges de categoria recebem atributos `data-testid` explícitos | `apps/runes/src/routes/categories/+page.svelte`, `CategoryBadge.svelte`, `CategorySelect.svelte` |

## Estrutura de código

```
pocketbase/pb_migrations/
└── 0024_create_categories_and_relations.js       # Migration da coleção categories + campos de relação

apps/runes/src/
├── lib/
│   ├── domain/
│   │   ├── categoryAccess.ts                     # Regras de acesso e funções puras
│   │   └── categoryAccess.test.ts                # Testes unitários do domínio
│   ├── server/
│   │   ├── categoryRecord.ts                     # Tipagem TypeScript da coleção e expansões
│   │   ├── todoRecord.ts                         # Atualização: campo category + expand
│   │   ├── kanbanRecord.ts                       # Atualização: campo category + expand
│   │   ├── pokerRecord.ts                        # Atualização: campo category + expand
│   │   ├── specRecord.ts                         # Atualização: campo category + expand
│   │   └── retroRecord.ts                        # Atualização: campo category + expand
│   ├── validation/
│   │   ├── categorySchemas.ts                    # Schemas Zod (create, update, delete)
│   │   ├── categorySchemas.test.ts               # Testes unitários dos schemas
│   │   ├── todoSchemas.ts                        # Atualização: suporte a category opcional
│   │   ├── kanbanSchemas.ts                      # Atualização: suporte a category opcional
│   │   ├── pokerSchemas.ts                       # Atualização: suporte a category opcional
│   │   ├── specSchemas.ts                        # Atualização: suporte a category opcional
│   │   └── retroSchemas.ts                       # Atualização: suporte a category opcional
│   └── components/
│       └── categories/
│           ├── CategoryBadge.svelte              # Badge visual reutilizável de categoria
│           └── CategorySelect.svelte             # Dropdown seletor reutilizável de categoria
└── routes/
    ├── +page.svelte                              # Atualização: card de Categorias no App Hub
    ├── categories/
    │   ├── +page.server.ts                       # Load (lista categorias + contagens) + Actions (create, update, delete)
    │   ├── +page.svelte                          # UI: CRUD e listagem de categorias
    │   └── [id]/
    │       ├── +page.server.ts                   # Load: dados agregados da categoria (Todos, Cards, Poker, Specs, Retro)
    │       └── +page.svelte                      # UI: visão agregada / busca transversal por categoria
    ├── todos/
    │   └── [id]/                                 # Atualização: seletor de categoria no form + badge + filtro
    ├── kanban/                                   # Atualização: seletor no modal de card + badge + filtro na toolbar
    ├── poker/                                    # Atualização: seletor na tarefa + badge + filtro
    └── projects/[projectId]/
        ├── specs/                                # Atualização: seletor no doc + badge + filtro
        └── sprints/[sprintId]/retro/             # Atualização: seletor no card + badge + filtro
```

## Camadas (Ports & Adapters — padrão real)

| Camada | Mudança prevista |
|--------|------------------|
| **PocketBase (migration + API Rules)** | `0024_create_categories_and_relations.js`: cria coleção `categories` com `name` (text, required), `description` (text), `created`, `updated` (autodate); adiciona campo `category` (relation, maxSelect: 1, cascadeDelete: false) em `todo_items`, `kanban_cards`, `poker_tasks`, `spec_documents` e `retro_cards`. |
| **Tipos `*Record.ts`** | `categoryRecord.ts`: define `CategoryRecord`. Atualiza `TodoItemRecord`, `KanbanCardRecord`, `PokerTaskRecord`, `SpecDocumentRecord`, `RetroCardRecord` para incluir `category?: string` e `expand?: { category?: CategoryRecord }`. |
| **Domínio puro** | `categoryAccess.ts`: funções puras de validação de acesso e ordenação/formatação de categorias + testes com Vitest. |
| **Validação Zod** | `categorySchemas.ts`: `createCategorySchema`, `updateCategorySchema`, `deleteCategorySchema`. Atualização dos schemas existentes para aceitar `category: z.string().optional()`. |
| **Form Actions & Load** | `routes/categories/+page.server.ts`: load de categorias com contagens agregadas; actions `create`, `update`, `delete`. `routes/categories/[id]/+page.server.ts`: load em paralelo com `Promise.all` agregando itens de cada módulo filtrados por `category = [id]`. |
| **Componentes & UI** | `CategoryBadge.svelte`, `CategorySelect.svelte`, catálogo em `/categories`, detalhes agregados em `/categories/[id]`, além da integração dos seletores e filtros nos 5 módulos. |

## Modelo de dados

| Coleção | Campos | Regras de acesso |
|---------|--------|------------------|
| `categories` | `id` (text), `name` (text, max: 50), `description` (text, max: 250), `created` (autodate), `updated` (autodate) | `listRule` = `@request.auth.id != ''`<br>`viewRule` = `@request.auth.id != ''`<br>`createRule` = `@request.auth.id != ''`<br>`updateRule` = `@request.auth.id != ''`<br>`deleteRule` = `@request.auth.id != ''` |
| `todo_items` | `+ category` (relation `categories`, maxSelect: 1, cascadeDelete: false) | Mantém regras vigentes de isolamento por `list.owner` |
| `kanban_cards` | `+ category` (relation `categories`, maxSelect: 1, cascadeDelete: false) | Mantém regras vigentes de projeto/participante |
| `poker_tasks` | `+ category` (relation `categories`, maxSelect: 1, cascadeDelete: false) | Mantém regras vigentes de sala/backlog |
| `spec_documents` | `+ category` (relation `categories`, maxSelect: 1, cascadeDelete: false) | Mantém regras vigentes de projeto |
| `retro_cards` | `+ category` (relation `categories`, maxSelect: 1, cascadeDelete: false) | Mantém regras vigentes de sprint/projeto |

## Contrato de API

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/categories` | — | `PageData` com `{ categories: CategoryRecord[] }` |
| POST (action) | `/categories?/create` | `name`, `description` | `{ success: true }` ou `fail(400, { errors })` |
| POST (action) | `/categories?/update` | `id`, `name`, `description` | `{ success: true }` ou `fail(400, { errors })` |
| POST (action) | `/categories?/delete` | `id` | `{ success: true }` ou `fail(400, { errors })` |
| GET | `/categories/[id]` | — | `PageData` com `{ category, todos, kanbanCards, pokerTasks, specDocs, retroCards }` |

## Estados de UI

| Estado | Comportamento / componente |
|--------|---------------------------|
| **Loading** | Skeletons na listagem de categorias e nos painéis de busca agregada |
| **Vazio** | Estado informativo amigável em `/categories` ("Nenhuma categoria cadastrada") e em `/categories/[id]` ("Nenhum item associado a esta categoria ainda") |
| **Erro** | Mensagens de validação inline via `form?.errors` e alertas de erro via toast DaisyUI |
| **Sucesso** | Feedback com mensagem toast e atualização reativa instantânea dos dados na tela |

## Decisões técnicas

| Decisão | Racional | Alternativas rejeitadas |
|---------|----------|-------------------------|
| **1. Relacionamento com `cascadeDelete: false`** | Atende ao requisito de Desvinculação Suave (Nullify), impedindo que a exclusão de uma categoria delete cartões ou tarefas importantes. | `cascadeDelete: true` descartado por violar integridade de dados do usuário. |
| **2. Consultas paralelas com `Promise.all` em `/categories/[id]`** | Garante tempo de resposta baixo (< 1s) ao agregar dados de 5 coleções independentes. | Consultas sequenciais descartadas por causarem latência acumulada. |
| **3. Componentes atômicos `CategoryBadge` e `CategorySelect`** | Evita duplicação de layout e regras de renderização de categoria entre os 5 módulos. | Implementar HTML/Tailwind solto em cada página descartado por causar inconsistência visual. |

## Memória aplicável

- `apps/runes/src/routes/+page.svelte` → Registrado no App Hub via `appRegistry`.
- `apps/runes/src/lib/server/pocketbase.ts` → Uso de `locals.pb` autenticado nas rotas do servidor (sem vazamento de token admin desnecessário).
- `ERR-FE-002` → Nunca colocar `throw redirect()` dentro de blocos `try/catch`.
- `REG-FE-001` → Nunca usar `window.alert()` nem classes fora da grade do Tailwind.
