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
├── +page.server.ts             ← Load: home — retorna pendingCount (itens pendentes do Todo)
├── +page.svelte                ← UI: App Hub — saudação + grid de apps (appRegistry)
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
│
├── profile/
│   ├── +page.server.ts         ← Load + Action uploadAvatar: upload de avatar do usuário atual
│   └── +page.svelte            ← UI: avatar atual + upload + botão ativar/desativar notificações push
│
├── api/push/
│   ├── subscribe/+server.ts    ← POST: cadastra/renova PushSubscription (idempotente por endpoint, via locals.pb)
│   └── unsubscribe/+server.ts  ← POST: remove PushSubscription do usuário atual (via locals.pb)
│
├── chat/
│   ├── +page.server.ts         ← Load: salas do usuário (com preview da última mensagem)
│   ├── +page.svelte            ← UI: listagem de salas
│   ├── new/
│   │   ├── +page.server.ts     ← Load (usuários) + Action: criar sala
│   │   └── +page.svelte        ← UI: formulário de criação (nome opcional + participantes)
│   └── [roomId]/
│       ├── +page.server.ts     ← Load + Actions: sendMessage (dispara sendChatPush fire-and-forget)/leaveRoom/addParticipant/removeParticipant
│       └── +page.svelte        ← UI: mensagens em tempo real (ChatMessagesFeed) + participantes
│
├── kanban/
│   ├── +page.server.ts         ← Load + Actions: criar/mover/deletar cartões e colunas + comentários
│   └── +page.svelte            ← UI: quadro Kanban interativo (KanbanBoard) com Drag and Drop
```

### 2.2 Camadas de Código

```
src/lib/
├── server/                     ← Server-only (excluído do vitest)
│   ├── pocketbase.ts           ← createServerClient: cria cliente PocketBase autenticado
│   ├── pocketbaseAdmin.ts      ← getAdminClient: cliente PocketBase superusuário (lookup de auth/impersonate)
│   ├── authUser.ts             ← Type: AuthenticatedUser (inclui avatar)
│   ├── authLookup.ts           ← findAuthRecordByEmail: busca registro auth por e-mail (via admin client)
│   ├── authExpand.ts           ← fetchAuthParticipants: resolve participantes (nome/avatar) via admin client
│   ├── userRecord.ts           ← Type: UserRecord
│   ├── todoRecord.ts           ← Types: TodoListRecord, TodoItemRecord
│   ├── chatRecord.ts           ← Types: ChatRoomRecord, ChatMessageRecord, AuthParticipant
│   ├── kanbanRecord.ts         ← Types: KanbanColumnRecord, KanbanCardRecord, KanbanCardCommentRecord, etc.
│   ├── kanbanHistory.ts        ← Server helper: registra modificações e histórico imutável
│   ├── richTextSanitize.ts     ← Allowlist compartilhada de sanitize-html (TaskList/TaskItem do Tiptap)
│   ├── pushRecord.ts           ← Type: PushSubscriptionRecord
│   ├── vapidKeys.ts            ← Leitura de PUBLIC_VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT
│   ├── pushSubscriptionStore.ts ← getSubscriptionsForUsers/removeInvalidSubscription via getAdminClient() (contexto do remetente/RF8)
│   └── webPush.ts              ← Wrapper web-push: sendChatPush(), sendSystemPush()
│
├── domain/                     ← Lógica de negócio pura
│   ├── todoListAccess.ts       ← canView, canWrite: controle de acesso a listas
│   ├── todoListAccess.test.ts  ← Testes
│   ├── chatRoomAccess.ts       ← isParticipant, isCreator, nextCreatorAfter: acesso e transferência de criador
│   ├── chatRoomAccess.test.ts  ← Testes
│   ├── ChatMessagesFeed.svelte.ts ← Classe reativa: mescla histórico (load) + eventos realtime, com dedup
│   ├── ChatMessagesFeed.test.ts  ← Testes
│   ├── kanbanAccess.ts         ← canCreateCard, canUpdateCard, canDeleteCard, etc. e reordenação de posições
│   ├── kanbanAccess.test.ts    ← Testes
│   ├── KanbanBoard.svelte.ts   ← Classe reativa: gerência de cards/colunas realtime com dedup
│   ├── KanbanBoard.test.ts     ← Testes
│   ├── pushPayload.ts          ← truncateMessage, isSafeRedirectUrl, buildChatPushPayload, buildSystemPushPayload
│   └── pushPayload.test.ts     ← Testes
│
├── validation/                 ← Schemas Zod + form errors
│   ├── authSchemas.ts          ← loginSchema
│   ├── authSchemas.test.ts     ← Testes
│   ├── todoSchemas.ts          ← createListSchema, addItemSchema
│   ├── todoSchemas.test.ts     ← Testes
│   ├── userSchemas.ts          ← createUserSchema, updateUserSchema, changePasswordSchema, etc.
│   ├── userSchemas.test.ts     ← Testes
│   ├── chatSchemas.ts          ← createRoomSchema, sendMessageSchema, avatarSchema
│   ├── chatSchemas.test.ts     ← Testes
│   ├── kanbanSchemas.ts        ← createCardSchema, createColumnSchema, addCommentSchema, etc.
│   ├── kanbanSchemas.test.ts   ← Testes
│   ├── pushSchemas.ts          ← subscribeSchema, unsubscribeSchema
│   ├── pushSchemas.test.ts     ← Testes
│   ├── formErrors.ts           ← fieldErrorsFrom: converte ZodError → Record<string, string>
│   └── formErrors.test.ts      ← Testes
│
├── auth/                       ← Lógica de autenticação
│   ├── passwordGate.ts         ← isPasswordExpired
│   └── passwordGate.test.ts    ← Testes
│
├── client/                     ← Lógica client-side
│   ├── authChannel.ts          ← BroadcastChannel: sync login/logout entre abas
│   ├── authChannel.test.ts     ← Testes
│   ├── pocketbaseClient.ts     ← createBrowserClient: cliente PocketBase client-side autenticado (subscriptions realtime)
│   ├── pushDecision.ts         ← shouldSuppressChatPush: decisão de supressão, testável sem mocks de `self`
│   ├── pushDecision.test.ts    ← Testes
│   └── pushSubscription.ts     ← Registra SW, solicita permissão, pushManager.subscribe/getSubscription, chama /api/push/*
│
├── appRegistry.ts               ← Registro estático de apps do hub (id, name, description, icon, route, adminOnly?) — inclui "Chat"
│
├── components/                 ← Componentes Svelte reutilizáveis
│   ├── UserForm.svelte         ← Formulário de usuário (create/edit)
│   ├── UserList.svelte         ← Tabela de listagem de usuários
│   ├── ChangePasswordForm.svelte ← Formulário de troca de senha
│   ├── AppCard.svelte          ← Card individual do App Hub (ícone, nome, descrição, badge)
│   ├── AppGrid.svelte          ← Grid responsivo que renderiza os AppCard
│   ├── Avatar.svelte           ← Avatar de usuário (imagem ou iniciais como placeholder)
│   ├── kanban/
│   │   └── RichTextEditor.svelte ← Editor de texto rico baseado no Tiptap
│   └── chat/
│       └── NotificationsBanner.svelte ← Banner contextual em /chat sugerindo ativar notificações
│
└── index.ts                    ← (vazio) barrel export
```

### 2.3 Service Worker

```
src/service-worker.ts           ← Eventos push (parse payload, supressão via pushDecision.ts para
                                   tipo chat, exibição incondicional para tipo system) e
                                   notificationclick (foca/abre aba, valida url via pushPayload.ts).
                                   Auto-registrado pelo SvelteKit (kit.serviceWorker default).
```

### 2.4 Server Hook

```
src/hooks.server.ts             ← handle: auth refresh, route protection, cookie sync
```

### 2.5 Testes E2E (Playwright)

```
e2e/
├── env.ts                      ← Constantes do seed + guard fail-fast (assertSeedAdmin)
├── fixtures.ts                 ← Login automático como admin (com guard) antes de cada teste
├── cleanup.ts                  ← Limpeza de registros via API PocketBase (user+auth, listas, salas de chat)
├── auth-cross-tab.spec.ts      ← Sync login/logout entre abas (BroadcastChannel)
├── todo-crud-basico.spec.ts    ← CRUD básico lista + item
├── change-password.spec.ts     ← Troca de senha (usuário temporário)
├── user-crud.spec.ts           ← CRUD usuário (admin)
├── todo-list-management.spec.ts ← Gerenciamento completo de lista
├── chat.spec.ts                ← Criação de sala, envio de mensagem, saída da sala
├── kanban.spec.ts              ← Teste E2E de cartões, colunas, comentários e histórico do Kanban
└── planning-poker.spec.ts      ← Teste E2E de salas, votação, revelação e exportação para Kanban
```

### 2.6 Configuração

| Arquivo                   | Função                                     |
| ------------------------- | ------------------------------------------ |
| `vite.config.ts`          | Vite + SvelteKit + Tailwind + Vitest       |
| `playwright.config.ts`    | Playwright (build + preview na porta 5175, sempre headless) |
| `tsconfig.json`           | TypeScript                                 |
| `package.json`            | Scripts: dev, build, test, test:e2e        |
| `.gitignore`              | Arquivos ignorados pelo git                |
| `.npmrc`                  | Configuração npm                           |
| `.vscode/extensions.json` | Extensões recomendadas VS Code             |
| `README.md`               | Descrição do app (template SvelteKit)      |
| `src/app.html`            | HTML shell do SvelteKit                    |
| `src/app.css`             | Estilos globais (Tailwind + DaisyUI)       |
| `src/app.d.ts`            | Declarações de tipo globais (App.Locals)   |
| `static/robots.txt`       | Configuração de robôs de busca             |

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
    ├── 0008_create_todo_collections.js      ← Coleções todo_lists + todo_items
    ├── 0009_add_timestamps_to_auth.js       ← Adiciona created/updated (autodate) à coleção auth
    ├── 0010_remove_default_users_collection.js ← Remove coleção "users" padrão de fábrica (sem uso)
    ├── 0011_create_chat_collections.js      ← Coleções chat_rooms + chat_messages
    ├── 0012_add_avatar_to_auth.js           ← Adiciona campo avatar (file) à coleção auth
    ├── 0013_open_user_listing_for_authenticated.js ← Abre listagem de "user" para qualquer autenticado
    ├── 0014_restrict_chat_room_update_rule.js ← Restringe updateRule de chat_rooms ao criador (corrige IDOR)
    ├── 0015_create_kanban_collections.js    ← Coleções kanban_columns, kanban_cards, kanban_card_comments, kanban_card_history
    ├── 0016_create_poker_collections.js     ← Coleções poker_rooms, poker_tasks, poker_participants, poker_votes
    ├── 0017_poker_backlog_global.js         ← Backlog global (status em poker_rooms) e ciclo de vida da sala
    └── 0018_create_push_subscriptions_collection.js ← Coleção push_subscriptions (endpoint único, API Rules de posse, updateRule = null)
```

---

## 6. Documentação

```
docs/
├── CODE-STRUCTURE.md           ← ⬅️ ESTE ARQUIVO — mapa da estrutura
├── README.md                   ← Índice geral da documentação
├── CHANGELOG.md                ← Histórico de funcionalidades
├── TECH-DEBT.md                ← Documento vivo de débitos técnicos identificados (e não corrigidos na hora)
├── spec-driven-development.md  ← Guia completo do fluxo SDD
├── runes-ports-adapters.md     ← Arquitetura do app runes
├── sveltekit-ports-adapters.plan.md ← Plano original do projeto
│
├── specs/                      ← Specs (antes de implementar)
│   ├── _template.md
│   ├── README.md               ← Índice de specs
│   ├── 2026-07-09-spec-driven-agent.md
│   ├── 2026-07-09-pocketbase-infra.md
│   ├── 2026-07-09-pocketbase-auth.md
│   ├── 2026-07-09-pocketbase-user-crud.md
│   ├── 2026-07-09-pocketbase-todo-sharing.md
│   └── 2026-07-10-app-hub.md
│
├── features/                   ← Feature docs (pós-implementação)
│   ├── _template.md
│   ├── README.md               ← Índice de features
│   ├── 2026-06-18-todo-list.md
│   ├── 2026-07-09-spec-driven-agent.md
│   ├── 2026-07-09-pocketbase-infra.md
│   ├── 2026-07-09-pocketbase-auth.md
│   ├── 2026-07-09-pocketbase-user-crud.md
│   ├── 2026-07-09-pocketbase-todo-sharing.md
│   └── 2026-07-10-app-hub.md
│
├── workflow/                   ← PRs + Jiras
│   ├── _template-jira.md
│   ├── _template-pr.md
│   ├── README.md               ← Índice de workflow
│   ├── 2026-07-10-app-hub.jira.md
│   └── <slug>.pr.md / <slug>.jira.md
│
└── testing/
    └── playwright.md           ← Guia de testes e2e
```

---

## 7. Regras e Skills para IA

| Local                                                   | Conteúdo                      | Propósito                                          |
| ------------------------------------------------------- | ----------------------------- | -------------------------------------------------- |
| `.cursor/rules/architecture/runes-ports-adapters.mdc`   | Ports & Adapters (runes)      | Checklist de implementação                         |
| `.cursor/rules/architecture/classic-ports-adapters.mdc` | Ports & Adapters (deprecated) | Referência histórica                               |
| `.cursor/rules/architecture/language-convention.mdc`    | Idioma                        | Código em inglês, UI em português                  |
| `.cursor/rules/architecture/data-testid.mdc`            | data-testid                   | data-testid em componentes + getByTestId em testes |
| `.cursor/rules/architecture/pocketbase-collections.mdc` | PocketBase                    | Toda coleção precisa dos campos `created`/`updated` |
| `.cursor/rules/documentation/feature-documentation.mdc` | Doc features                  | Criar/atualizar docs/features/                     |
| `.cursor/rules/workflow/spec-driven.mdc`                | Spec-driven                   | Criar docs/specs/                                  |
| `.cursor/rules/workflow/pr-description.mdc`             | PR                            | Criar docs/workflow/<slug>.pr.md                   |
| `.cursor/rules/workflow/jira-tasks.mdc`                 | Jira                          | Criar docs/workflow/<slug>.jira.md                 |
| `.cursor/rules/meta/rules-sync.mdc`                     | Sync                          | Manter regras sincronizadas                        |
| `.cursor/rules/meta/commit-convention.mdc`              | Commits                       | Sem co-autoria de IA                               |
| `.cursor/rules/meta/code-structure.mdc`                 | Estrutura                     | Ler CODE-STRUCTURE.md antes; atualizar docs depois |
| `.agents/skills/spec-driven.md`                         | SDD (Freebuff)                | Equivalente ao agente Claude                       |
| `.agents/skills/runes-ports-adapters.md`                | Runes (Freebuff)              | Guia de implementação runes                        |
| `.agents/skills/classic-ports-adapters.md`              | Classic (Freebuff)            | Guia de implementação classic (deprecated)         |
| `.agents/skills/feature-documentation.md`               | Feature doc (Freebuff)        | Documentação de features                           |
| `.agents/skills/language-convention.md`                 | Idioma (Freebuff)             | Convenção de idioma                                |
| `.agents/skills/code-structure.md`                      | Estrutura (Freebuff)          | Ler CODE-STRUCTURE.md antes; atualizar docs depois |
| `.agents/skills/data-testid.md`                         | data-testid (Freebuff)        | data-testid em componentes + getByTestId em testes |
| `.agents/skills/pocketbase-collections.md`               | PocketBase (Freebuff)         | Toda coleção precisa dos campos `created`/`updated` |
| `.cursor/rules/meta/tech-debt.mdc`                      | Débito técnico                | Registrar débito identificado (não corrigido) em `docs/TECH-DEBT.md` |
| `.agents/skills/tech-debt.md`                           | Débito técnico (Freebuff)     | Equivalente à regra acima                          |
| `.claude/agents/spec-driven.md`                         | SDD (Claude)                  | Agente spec-driven original                        |

---

## 8. Configurações do Projeto

| Arquivo                         | Função                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `pnpm-workspace.yaml`           | Workspaces: `apps/runes`, `packages/*`                                                                |
| `turbo.json`                    | Tasks: build, test, test:e2e, check, dev, backend:\*, dev:full, dev:reset                             |
| `tsconfig.json` (raiz)          | References: todo-domain, runes                                                                        |
| `package.json` (raiz)           | Scripts globais + turbo. `dev:full` verifica se Docker está rodando antes de subir + frontend (runes) |
| `.env.example`                  | Variáveis de ambiente (PocketBase)                                                                    |
| `.npmrc`                        | Config npm (raiz)                                                                                     |
| `.vscode/settings.json`         | Configurações do VS Code                                                                              |
| `.gitignore` (raiz)             | Arquivos ignorados pelo git                                                                           |
| `.agents/skills/`               | Skills Freebuff (7 skills)                                                                            |
| `.claude/agents/spec-driven.md` | Agente Claude (processo)                                                                              |
| `.claude/settings.local.json`   | Permissões do Claude                                                                                  |

---

## 9. Testes — Resumo

| Pacote/App           | Unit    | E2E          | Total    |
| -------------------- | ------- | ------------ | -------- |
| `todo-domain`        | 60      | —            | 60       |
| `runes`              | 134     | 8 specs      | 142+     |
| `deprecated/classic` | 17      | 2 specs      | 19+      |
| `deprecated/remote`  | 15      | —            | 15       |
| **Total**            | **226** | **10 specs** | **236+** |

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
