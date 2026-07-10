# Estrutura do Código — svelte-app-clean-arch

> **Propósito:** Mapa completo da estrutura do projeto para facilitar navegação, verificação de código e manutenção.
> **Regra:** Este arquivo deve ser **sempre atualizado** ao concluir qualquer tarefa que adicione, remova ou mova arquivos/pastas no projeto.

---

## 1. Visão Geral

Monorepo SvelteKit com **Ports & Adapters**: app ativo `runes` + pacote compartilhado `packages/todo-domain`.  
Os apps `classic` e `remote` foram movidos para `deprecated/`.

```
raiz/
├── apps/runes/          ← App SvelteKit ativo (default)
├── deprecated/
│   ├── classic/         ← App classic (descontinuado)
│   └── remote/          ← App remote (descontinuado)
├── packages/
│   └── todo-domain/     ← Domínio e gateways compartilhados
├── pocketbase/          ← Backend PocketBase (Docker + migrations)
├── docs/                ← Documentação completa
├── .cursor/rules/       ← Regras para IA (Cursor)
├── .agents/skills/      ← Skills Freebuff
└── .claude/agents/      ← Agentes Claude
```

---

## 2. App Ativo: `apps/runes/`

App SvelteKit com PocketBase (autenticação + CRUD multi-lista).  
Porta: `5175` | Framework: Svelte 5 Runes | Estilo: Tailwind + DaisyUI

### 2.1 Rotas (SvelteKit)

```
src/routes/
├── +layout.server.ts          ← Load layout: expõe `locals.user`
├── +layout.svelte              ← Layout: navbar, logout, alerta change-password
├── +page.server.ts             ← Redireciona / → /todos
├── +page.svelte                ← Nunca renderizado (redirect)
│
├── login/
│   ├── +page.server.ts         ← Form action: autenticação via PocketBase
│   └── +page.svelte            ← UI: formulário de login
│
├── logout/
│   └── +server.ts              ← POST: limpa sessão e redireciona
│
├── change-password/
│   ├── +page.server.ts         ← Form action: troca de senha
│   └── +page.svelte            ← UI: formulário de troca de senha
│
├── todos/
│   ├── +page.server.ts         ← Load: lista do usuário atual
│   ├── +page.svelte            ← UI: listagem de listas
│   ├── new/
│   │   ├── +page.server.ts     ← Action: criar nova lista
│   │   └── +page.svelte        ← UI: formulário de criação
│   └── [id]/
│       ├── +page.server.ts     ← Load + Actions: ver/editar/excluir lista + itens
│       └── +page.svelte        ← UI: detalhe da lista com itens
│
├── users/
│   ├── +page.server.ts         ← Load: lista de usuários (admin only)
│   ├── +page.svelte            ← UI: tabela de usuários
│   ├── new/
│   │   ├── +page.server.ts     ← Action: criar usuário (admin only)
│   │   └── +page.svelte        ← UI: formulário de criação
│   └── [id]/edit/
│       ├── +page.server.ts     ← Load + Actions: update/resetPassword/delete
│       └── +page.svelte        ← UI: formulário de edição + reset senha + excluir
```

### 2.2 Camadas de Código

```
src/lib/
├── server/                     ← Server-only (excluído do vitest)
│   ├── pocketbase.ts           ← createServerClient: cria cliente PocketBase autenticado
│   ├── authUser.ts             ← Type: AuthenticatedUser
│   ├── userRecord.ts           ← Type: UserRecord
│   └── todoRecord.ts           ← Types: TodoListRecord, TodoItemRecord
│
├── domain/                     ← Lógica de negócio pura
│   ├── todoListAccess.ts       ← canView, canWrite: controle de acesso a listas
│   └── todoListAccess.test.ts  ← Testes
│
├── validation/                 ← Schemas Zod + form errors
│   ├── authSchemas.ts          ← loginSchema
│   ├── authSchemas.test.ts     ← Testes
│   ├── todoSchemas.ts          ← createListSchema, addItemSchema
│   ├── todoSchemas.test.ts     ← Testes
│   ├── userSchemas.ts          ← createUserSchema, updateUserSchema, changePasswordSchema, etc.
│   ├── userSchemas.test.ts     ← Testes
│   ├── formErrors.ts           ← fieldErrorsFrom: converte ZodError → Record<string, string>
│   └── formErrors.test.ts      ← Testes
│
├── auth/                       ← Lógica de autenticação
│   ├── passwordGate.ts         ← isPasswordExpired
│   └── passwordGate.test.ts    ← Testes
│
├── client/                     ← Lógica client-side
│   ├── authChannel.ts          ← BroadcastChannel: sync login/logout entre abas
│   └── authChannel.test.ts     ← Testes
│
├── components/                 ← Componentes Svelte reutilizáveis
│   ├── UserForm.svelte         ← Formulário de usuário (create/edit)
│   ├── UserList.svelte         ← Tabela de listagem de usuários
│   └── ChangePasswordForm.svelte ← Formulário de troca de senha
│
└── index.ts                    ← (vazio) barrel export
```

### 2.3 Server Hook

```
src/hooks.server.ts             ← handle: auth refresh, route protection, cookie sync
```

### 2.4 Testes E2E (Playwright)

```
e2e/
├── fixtures.ts                 ← Login automático como admin antes de cada teste
├── auth-cross-tab.spec.ts      ← Sync login/logout entre abas (BroadcastChannel)
├── todo-sharing.spec.ts        ← CRUD lista + itens
├── change-password.spec.ts     ← Troca de senha
├── user-crud.spec.ts           ← CRUD usuário (admin)
└── todo-list-management.spec.ts ← Gerenciamento completo de lista
```

### 2.5 Configuração

| Arquivo | Função |
|---------|--------|
| `vite.config.ts` | Vite + SvelteKit + Tailwind + Vitest |
| `playwright.config.ts` | Playwright (build + preview na porta 4175) |
| `tsconfig.json` | TypeScript |
| `package.json` | Scripts: dev, build, test, test:e2e |
| `.gitignore` | Arquivos ignorados pelo git |
| `.npmrc` | Configuração npm |
| `.vscode/extensions.json` | Extensões recomendadas VS Code |
| `README.md` | Descrição do app (template SvelteKit) |
| `src/app.html` | HTML shell do SvelteKit |
| `src/app.css` | Estilos globais (Tailwind + DaisyUI) |
| `src/app.d.ts` | Declarações de tipo globais (App.Locals) |
| `static/robots.txt` | Configuração de robôs de busca |

---

## 3. Apps Descontinuados: `deprecated/`

### 3.1 `deprecated/classic/`

App SvelteKit com Observable/Observer + REST. Porta: `5173`.

```
src/
├── lib/
│   ├── server/todoStore.ts     ← Store em memória (getTodos, addTodo, updateTodo, removeTodo)
│   ├── components/
│   │   ├── TodoList.svelte     ← Componente presentacional
│   │   ├── TodoListContainer.svelte ← Container com gateway + Observer
│   │   └── invalidate/         ← Variante com invalidate()
│   └── index.ts
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   ├── api/
│   │   ├── todos/+server.ts    ← GET/POST
│   │   ├── todos/[id]/+server.ts ← PUT/DELETE
│   │   └── test/reset/+server.ts ← POST: reset store (uso e2e)
│   └── invalidate/+page.svelte
├── e2e/
│   ├── fixtures.ts
│   ├── todo-list.spec.ts       ← CRUD itens
│   └── todo-list-invalidate.spec.ts ← Variante invalidate
└── package.json, vite.config.ts, playwright.config.ts
```

### 3.2 `deprecated/remote/`

App SvelteKit com Observable + Remote Functions. Porta: `5174`.

```
src/
├── lib/
│   ├── server/todoStore.ts     ← Store em memória (idêntica ao classic)
│   ├── components/
│   │   ├── TodoList.svelte     ← Componente presentacional
│   │   └── TodoListContainer.svelte ← Container com gateway + Observer
│   └── index.ts
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   └── todos.remote.ts         ← Remote functions (query/command)
└── package.json, vite.config.ts
```

---

## 4. Pacote Compartilhado: `packages/todo-domain/`

Domínio e gateways compartilhados entre todos os apps.

### 4.1 Observables

```
src/observable/
├── Observable.ts               ← Base: register + notify
├── Observer.ts                 ← Par event + callback
├── Item.ts                     ← Entidade: id, description, done, toDTO()
└── TodoList.ts                 ← Agregado: items, addItem, removeItem, toggleDone, getCompleted
```

### 4.2 Gateways (Ports & Adapters)

```
src/gateways/
├── TodoGateway.ts              ← Interface: getTodos, addItem, updateItem, removeItem
├── TodoMemoryGateway.ts        ← Adaptador em memória (testes)
├── TodoHttpGateway.ts          ← Adaptador HTTP (fetch)
└── TodoRemoteGateway.ts        ← Adaptador Remote Functions
```

### 4.3 Types

```
src/types.ts                    ← TodoItemDTO, createId(), SEED_TODOS
```

### 4.4 Testes

```
test/
├── observable/
│   ├── TodoList.test.ts        ← 19 testes: CRUD, notificações, limites
│   ├── Item.test.ts            ← 5 testes: construtor, toDTO, imutabilidade
│   └── Observable.test.ts      ← 7 testes: register, notify, múltiplos observers
├── gateways/
│   ├── TodoMemoryGateway.test.ts ← 10 testes: CRUD completo, casos de borda
│   ├── TodoHttpGateway.test.ts ← 8 testes: fetch mockado, sucesso/falha
│   └── TodoRemoteGateway.test.ts ← 5 testes: delegação para funções remote
└── types.test.ts               ← 6 testes: createId, SEED_TODOS
```

---

## 5. Backend PocketBase

```
pocketbase/
├── Dockerfile                  ← Imagem PocketBase customizada
├── docker-compose.yml          ← Serviço com volume + porta 18090
├── docker-entrypoint.sh        ← Entrypoint com migrations
├── .env.example                ← Variáveis de ambiente (admin seed)
└── pb_migrations/              ← Migrations (executadas em ordem)
    ├── 0001_create_auth_collection.js       ← Coleção "auth"
    ├── 0002_create_user_collection.js       ← Coleção "user"
    ├── 0003_seed_admin.js                   ← Seed admin + app user
    ├── 0004_allow_self_lookup_on_user.js    ← Regra: user pode ver próprio registro
    ├── 0005_user_auth_rules.js              ← Regras de autenticação
    ├── 0006_fix_seed_admin_email_visibility.js
    ├── 0007_restrict_self_update_fields.js  ← Corrige privilege escalation
    └── 0008_create_todo_collections.js      ← Coleções todo_lists + todo_items
```

---

## 6. Documentação

```
docs/
├── CODE-STRUCTURE.md           ← ⬅️ ESTE ARQUIVO — mapa da estrutura
├── README.md                   ← Índice geral da documentação
├── CHANGELOG.md                ← Histórico de funcionalidades
├── spec-driven-development.md  ← Guia completo do fluxo SDD
├── runes-ports-adapters.md     ← Arquitetura do app runes
├── sveltekit-ports-adapters.plan.md ← Plano original do projeto
│
├── specs/                      ← Specs (antes de implementar)
│   ├── _template.md
│   ├── README.md               ← Índice de specs
│   ├── spec-driven-agent.md
│   ├── pocketbase-infra.md
│   ├── pocketbase-auth.md
│   ├── pocketbase-user-crud.md
│   └── pocketbase-todo-sharing.md
│
├── features/                   ← Feature docs (pós-implementação)
│   ├── _template.md
│   ├── README.md               ← Índice de features
│   ├── todo-list.md
│   ├── spec-driven-agent.md
│   ├── pocketbase-infra.md
│   ├── pocketbase-auth.md
│   ├── pocketbase-user-crud.md
│   └── pocketbase-todo-sharing.md
│
├── workflow/                   ← PRs + Jiras
│   ├── _template-jira.md
│   ├── _template-pr.md
│   ├── README.md               ← Índice de workflow
│   └── <slug>.pr.md / <slug>.jira.md
│
└── testing/
    └── playwright.md           ← Guia de testes e2e
```

---

## 7. Regras e Skills para IA

| Local | Conteúdo | Propósito |
|-------|----------|-----------|
| `.cursor/rules/architecture/runes-ports-adapters.mdc` | Ports & Adapters (runes) | Checklist de implementação |
| `.cursor/rules/architecture/classic-ports-adapters.mdc` | Ports & Adapters (deprecated) | Referência histórica |
| `.cursor/rules/architecture/language-convention.mdc` | Idioma | Código em inglês, UI em português |
| `.cursor/rules/documentation/feature-documentation.mdc` | Doc features | Criar/atualizar docs/features/ |
| `.cursor/rules/workflow/spec-driven.mdc` | Spec-driven | Criar docs/specs/ |
| `.cursor/rules/workflow/pr-description.mdc` | PR | Criar docs/workflow/<slug>.pr.md |
| `.cursor/rules/workflow/jira-tasks.mdc` | Jira | Criar docs/workflow/<slug>.jira.md |
| `.cursor/rules/meta/rules-sync.mdc` | Sync | Manter regras sincronizadas |
| `.cursor/rules/meta/commit-convention.mdc` | Commits | Sem co-autoria de IA |
| `.cursor/rules/meta/code-structure.mdc` | Estrutura | Manter `docs/CODE-STRUCTURE.md` atualizado |
| `.agents/skills/spec-driven.md` | SDD (Freebuff) | Equivalente ao agente Claude |
| `.agents/skills/runes-ports-adapters.md` | Runes (Freebuff) | Guia de implementação runes |
| `.agents/skills/classic-ports-adapters.md` | Classic (Freebuff) | Guia de implementação classic (deprecated) |
| `.agents/skills/feature-documentation.md` | Feature doc (Freebuff) | Documentação de features |
| `.agents/skills/language-convention.md` | Idioma (Freebuff) | Convenção de idioma |
| `.agents/skills/code-structure.md` | Estrutura (Freebuff) | Manter `docs/CODE-STRUCTURE.md` atualizado |
| `.claude/agents/spec-driven.md` | SDD (Claude) | Agente spec-driven original |

---

## 8. Configurações do Projeto

| Arquivo | Função |
|---------|--------|
| `pnpm-workspace.yaml` | Workspaces: `apps/runes`, `packages/*` |
| `turbo.json` | Tasks: build, test, test:e2e, check, dev, backend:*, dev:full, dev:reset |
| `tsconfig.json` (raiz) | References: todo-domain, runes |
| `package.json` (raiz) | Scripts globais + turbo. `dev:full` verifica se Docker está rodando antes de subir + frontend (runes) |
| `.env.example` | Variáveis de ambiente (PocketBase) |
| `.npmrc` | Config npm (raiz) |
| `.vscode/settings.json` | Configurações do VS Code |
| `.gitignore` (raiz) | Arquivos ignorados pelo git |
| `.agents/skills/` | Skills Freebuff (7 skills) |
| `.claude/agents/spec-driven.md` | Agente Claude (processo) |
| `.claude/settings.local.json` | Permissões do Claude |

---

## 9. Testes — Resumo

| Pacote/App | Unit | E2E | Total |
|-----------|------|-----|-------|
| `todo-domain` | 60 | — | 60 |
| `runes` | 38 | 5 specs | 43+ |
| `deprecated/classic` | 17 | 2 specs | 19+ |
| `deprecated/remote` | 15 | — | 15 |
| **Total** | **130** | **7 specs** | **137+** |

---

## 10. Fluxo de Dados (runes)

```
+page.svelte
    │
    ▼
Container.svelte  ──cria──▶  TodoHttpGateway (todo-domain)
    │                              │
    │ instancia                    │ HTTP fetch
    ▼                              ▼
Service (.svelte.ts)         /api/.../+server.ts
    │                              │
    │ contém                       │ chama
    ▼                              ▼
Domínio (.svelte.ts)         $lib/server/...Store.ts
    │                         (PocketBase)
    │ contém
    ▼
Entidades (.svelte.ts)

Autenticação:
  hooks.server.ts → createServerClient() → PocketBase auth
  passwordGate.ts → isPasswordExpired()  → gate de troca de senha
  authChannel.ts  → BroadcastChannel     → sync cross-tab
```
