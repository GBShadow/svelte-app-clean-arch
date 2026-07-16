# Todo multi-lista com compartilhamento (runes)

Created: 2026-07-09


## Resumo

Cada usuário autenticado de `apps/runes` gerencia várias listas de todo próprias (criar, editar, excluir, itens). Uma lista com `public = true` pode ser vista, somente leitura, por qualquer outro usuário autenticado que acesse o link direto — escrita continua bloqueada para quem não é dono, mesmo assim, reforçado tanto pelas API Rules do PocketBase quanto por checagem server-side no SvelteKit. A antiga lista global sem dono foi removida do runes (decisão do usuário, já que a spec a descontinuava).

## App(s) afetado(s)

- **runes** — `/todos`, `/todos/new`, `/todos/[id]` (nova área; substitui a home antiga)

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Infra (PocketBase) | `pocketbase/pb_migrations/0008_create_todo_collections.js` — coleções `todo_lists`/`todo_items` + API Rules |
| Autorização | `apps/runes/src/lib/domain/todoListAccess.ts` — `canView`/`canWrite`, predicados puros |
| Validação | `apps/runes/src/lib/validation/todoSchemas.ts` — `createListSchema`, `addItemSchema` |
| Tipos | `apps/runes/src/lib/server/todoRecord.ts` — `TodoListRecord`, `TodoItemRecord` |
| Server/UI | `apps/runes/src/routes/+page.server.ts` (redireciona `/` → `/todos`) |
| Server/UI | `apps/runes/src/routes/todos/+page.server.ts` + `+page.svelte` (lista as próprias listas) |
| Server/UI | `apps/runes/src/routes/todos/new/+page.server.ts` + `+page.svelte` (criação) |
| Server/UI | `apps/runes/src/routes/todos/[id]/+page.server.ts` + `+page.svelte` (detalhe: edição para dono, leitura para visitante público) |
| UI | `apps/runes/src/routes/+layout.svelte` — link "Minhas listas" |
| Testes | `todoListAccess.test.ts`, `todoSchemas.test.ts`, `e2e/todo-sharing.spec.ts` |
| **Removido** | `TodoListContainer.svelte`, `TodoList.svelte`(+test), `Item.svelte.ts`, `TodoList.svelte.ts`(+test), `TodoListService.svelte.ts`(+test), `todoStore.ts`, `routes/api/todos/**`, `routes/api/test/reset`, `e2e/todo-list.spec.ts` — feature de lista única do runes, descontinuada (ver Decisões de design) |

## Fluxo (Ports & Adapters)

```
/todos (load)
  → getFullList('todo_lists') filtrado por owner = próprio usuário
    [listRule do PocketBase também restringiria a owner||public, mas o filtro explícito
     garante que só as PRÓPRIAS listas aparecem aqui — públicas de terceiros não entram]

/todos/new (actions.default)
  → valida createListSchema (Zod)
  → cria todo_lists { title, owner: self, public: false }
    [createRule do PocketBase exige @request.body.owner = @request.auth.id — mesmo
     que o SvelteKit tentasse enviar outro owner, seria rejeitado]

/todos/[id] (load)
  → busca a lista (getOne) — se a viewRule do PocketBase já bloquear, 404 direto
  → canView(list, userId) — segunda checagem explícita (defesa em profundidade)
  → busca itens (getFullList filtrado por list = id)
  → retorna { list, items, isOwner: canWrite(list, userId) }

/todos/[id] actions (updateTitle, togglePublic, delete, addItem, toggleItem, removeItem)
  → cada uma: busca a lista, canWrite(list, userId) → fail(403) se não for dono
  → só então chama o PocketBase (dupla validação: API Rule + checagem SvelteKit)
```

## API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/todos` | — | Listas do usuário logado |
| POST (form action) | `/todos/new` | `title` | Redirect `/todos/[id]` ou `fail(400, {errors})` |
| GET | `/todos/[id]` | — | Dados da lista + itens (leitura ou edição conforme posse) ou `error(403/404)` |
| POST (form action) | `/todos/[id]` (`?/updateTitle`) | `title` | `{success:true}` ou `fail(400/403)` |
| POST (form action) | `/todos/[id]` (`?/togglePublic`) | — | `{success:true}` ou `fail(403)` |
| POST (form action) | `/todos/[id]` (`?/delete`) | — | Redirect `/todos` ou `fail(403)` |
| POST (form action) | `/todos/[id]` (`?/addItem`/`?/toggleItem`/`?/removeItem`) | `description` / `itemId` | `{success:true}` ou `fail(400/403)` |

## Como testar

```bash
cp .env.example .env
pnpm backend:dev
pnpm --filter runes dev
pnpm --filter runes test
pnpm --filter runes test:e2e
```

Validação manual executada com PocketBase real (Docker, volume limpo, migrations 0001–0008 do zero) e duas contas reais (`owner@example.com`, `outro@example.com`):

- AC1/AC2: `/todos` vazio → cria lista "Compras" → adiciona item "Comprar leite".
- AC3: edita título para "Compras da semana" e ativa `public`.
- AC4: `outro@example.com` acessa `/todos/[id]` e vê título+item, sem botões de adicionar/editar/excluir.
- AC5: lista voltada a privada → `outro@example.com` recebe **404** (a `viewRule` do PocketBase já barra o `getOne` antes mesmo da checagem `canView` do SvelteKit rodar — mais forte que vazar um 403, que ao menos confirmaria a existência do registro).
- AC6: com a lista pública de novo, `outro@example.com` tenta `addItem` pela action do SvelteKit → `fail(403)`; e, **indo direto na API do PocketBase** (fora do app), tenta criar item, mudar título e excluir a lista → os três bloqueados (400/404) pelas API Rules, confirmando a dupla camada pedida no NFR1.
- AC7: dono exclui a lista → some de `/todos`, `outro@example.com` perde o acesso ao link (404), item cascateado junto (via `cascadeDelete: true` na relação).
- e2e Playwright real (Chromium): cria lista, adiciona item, marca como feito, exclui — `e2e/todo-sharing.spec.ts`.
- `pnpm test`, `pnpm check`, `pnpm build` e toda a suíte e2e (`auth-cross-tab` + `todo-sharing`) sem regressões; `classic`/`remote` não foram tocados e continuam com o `TodoGateway` original.

## Decisões de design

- **Remoção da feature de lista única do runes**: a spec descontinuava "a lista global antiga" mas não dizia explicitamente o que fazer com a rota `/`, os componentes e os testes existentes. Perguntado ao usuário — decisão: remover (`TodoListContainer`, `TodoList.svelte`, `todoStore.ts`, `/api/todos`, `/api/test/reset`, `e2e/todo-list.spec.ts`) e fazer `/` redirecionar para `/todos`. `classic`/`remote` continuam com a lista global via `TodoGateway`/`TodoMemoryGateway`/`TodoHttpGateway` normalmente — nada nesses apps foi alterado.
- **Sem `TodoListsGateway`/`TodoListsPocketBaseGateway`/`TodoListsService.svelte.ts`** (o Design table da spec sugeria essa camada, espelhando o padrão da feature de lista única original): optado por seguir o mesmo padrão já validado em `pocketbase-auth` e `pocketbase-user-crud` — chamadas diretas a `locals.pb.collection(...)` dentro de `+page.server.ts`, com todas as mutações via form actions. Como toda a leitura/escrita passa por `load`/`actions` no servidor (nunca o client fala com o PocketBase diretamente), uma camada de Gateway adicional não teria consumidor real além de um único adapter — em vez disso, a parte que realmente precisa ser testável isoladamente (a lógica de autorização) foi extraída como funções puras (`canView`/`canWrite`), que são o que os testes unitários exercitam.
- **Migration renumerada**: a spec sugeria `0005_create_todo_collections.js`, já ocupada pelo self-lookup de `pocketbase-auth`. Usada `0008` (sequência após as migrations de `pocketbase-user-crud`, incluindo o fix de segurança `0007`).
- **Bug real encontrado — `sort=-created` falhava com 400**: as coleções `todo_lists`/`todo_items` foram criadas sem os campos `created`/`updated` (não são adicionados automaticamente para coleções `base`, diferente dos campos de sistema de coleções `auth`). Corrigido adicionando `{ type: "autodate", name: "created", onCreate: true }` e o equivalente para `updated` na própria migration `0008` — nada de migration adicional, pois isso nunca chegou a "funcionar incorretamente" em produção (erro 100% do lado da criação da coleção, corrigido antes de qualquer dado real existir).
- **`getOne` de lista privada por não-dono retorna 404, não 403**: a `viewRule` do PocketBase (`owner = self || public = true`) já barra a consulta antes mesmo do `canView` do SvelteKit ser avaliado — resultado é 404 (não vaza nem a existência do registro), tecnicamente diferente do "403" sugerido no RF7/AC5, mas cumpre exatamente o objetivo declarado ("o link não vaza a lista"), então mantido assim.
- **`createRule`/`updateRule` protegem contra sequestro de posse** (lição de `pocketbase-user-crud`): `todo_lists.createRule` exige `@request.body.owner = @request.auth.id` (não dá pra criar lista em nome de outro usuário) e `updateRule` trava `@request.body.owner:changed = false` (dono não pode transferir a lista). O mesmo vale para `todo_items.updateRule` com `@request.body.list:changed = false` (item não pode ser "movido" para outra lista via update direto).
