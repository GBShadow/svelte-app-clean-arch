# Todo multi-lista com compartilhamento (runes)

Created: 2026-07-09


## Contexto

Hoje `apps/runes` tem uma única lista de todo global, sem dono. Com autenticação e usuários já existentes ([`pocketbase-auth`](./2026-07-09-pocketbase-auth.md), [`pocketbase-user-crud`](./2026-07-09-pocketbase-user-crud.md)), cada usuário deve poder ter várias listas próprias, e opcionalmente compartilhar uma lista (somente leitura) com qualquer outro usuário autenticado que tenha o link, via uma flag `public`.

## Objetivo

Usuário autenticado gerencia várias listas de todo próprias (criar, editar, excluir, adicionar/marcar/remover itens). Uma lista com `public = true` pode ser visualizada (somente leitura) por qualquer outro usuário autenticado que acesse o link direto. Nenhuma escrita (criar/editar/excluir lista ou item) é permitida a quem não é o dono, mesmo com o link.

## Escopo

**Incluído:**

- Coleções `todo_lists` e `todo_items` no PocketBase (migration)
- CRUD de listas (título, flag `public`) — dono apenas
- CRUD de itens dentro de uma lista (descrição, concluído) — dono apenas
- Visualização somente leitura de lista pública via link direto, para qualquer usuário autenticado
- Validação de posse via API Rules do PocketBase **e** checagem server-side no SvelteKit (dupla validação)
- Validação de formulários com Zod, ações via form actions

**Fora do escopo:**

- Compartilhamento por pessoa específica / permissões granulares (é só a flag `public` on/off, sem lista de convidados)
- Comentários, anexos ou qualquer metadado além de título/itens
- Migração dos dados da lista global atual (`SEED_TODOS`) — a lista global antiga é descontinuada nesta spec, cada usuário começa sem listas

## Requisitos funcionais

- RF1: Usuário autenticado vê em `/todos` apenas as listas das quais é dono.
- RF2: Usuário cria uma nova lista (`title`, `public` inicialmente `false`) em `/todos/new`; a lista criada pertence a ele (`owner = locals.user`).
- RF3: Dono edita título e a flag `public` da própria lista.
- RF4: Dono exclui a própria lista (e os itens associados).
- RF5: Dentro de uma lista própria, dono adiciona, edita descrição, marca como concluído e remove itens.
- RF6: Se `public = true`, qualquer usuário autenticado (não apenas o dono) que acessar `/todos/[id]` diretamente consegue visualizar título e itens, em modo somente leitura (sem formulários de criar/editar/excluir visíveis).
- RF7: Se `public = false`, qualquer usuário que não seja o dono tentando acessar `/todos/[id]` recebe 403/redirect — o link não vaza a lista.
- RF8: Tentativas de criar/editar/excluir lista ou item por quem não é o dono são bloqueadas mesmo que a lista seja pública e mesmo que a requisição não passe pela UI (ex.: chamada direta à API do PocketBase) — reforçado por API Rules, não apenas pela UI do SvelteKit.

## Requisitos não funcionais

- Toda mutação (criar/editar/excluir lista ou item) faz uma checagem server-side explícita de `list.owner === locals.user.id` **antes** de chamar o PocketBase, além das API Rules do PocketBase — camadas redundantes, conforme pedido ("validar server-side quando possível").
- Testes cobrindo: dono operando normalmente, não-dono tentando escrever (bloqueado), não-dono lendo lista pública (permitido), não-dono lendo lista privada (bloqueado).

## Critérios de aceite

- [ ] AC1: Dado um usuário autenticado sem listas, quando acessa `/todos`, então vê uma lista vazia com opção de criar.
- [ ] AC2: Dado um usuário autenticado, quando cria uma lista com título "Compras", então ela aparece em `/todos` e ele consegue adicionar itens a ela.
- [ ] AC3: Dado o dono de uma lista, quando marca `public = true` e edita o título, então as mudanças persistem e são visíveis para ele.
- [ ] AC4: Dado o dono de uma lista `public = true`, quando compartilha o link `/todos/[id]` com outro usuário autenticado, então esse outro usuário consegue ver título e itens, mas não vê botões de adicionar/editar/excluir.
- [ ] AC5: Dado outro usuário autenticado tentando acessar `/todos/[id]` de uma lista com `public = false` da qual não é dono, então recebe acesso negado (403/redirect), sem ver conteúdo da lista.
- [ ] AC6: Dado outro usuário autenticado (não dono) tentando enviar diretamente uma requisição de criação/edição/exclusão de item ou lista que não é sua (mesmo pública), então a operação é rejeitada tanto pela API Rule do PocketBase quanto pela checagem server-side do SvelteKit.
- [ ] AC7: Dado o dono excluindo uma lista, quando confirma a exclusão, então a lista e todos os seus itens somem, inclusive para quem tinha o link público.
- [ ] Testes cobrindo os cenários acima (incluindo `TodoMemoryGateway`/fake para os casos que não dependem do PocketBase real).

## Design (Ports & Adapters — runes)

| Camada | Mudança prevista |
|--------|-------------------|
| PocketBase | `pocketbase/pb_migrations/0005_create_todo_collections.js` — cria `todo_lists` (`title` text, `owner` relation → `auth` required, `public` bool default `false`) e `todo_items` (`list` relation → `todo_lists` required, `description` text, `done` bool default `false`) |
| PocketBase | API Rules `todo_lists`: `listRule`/`viewRule` = `owner = @request.auth.id \|\| public = true`; `createRule` = `@request.auth.id != ''`; `updateRule`/`deleteRule` = `owner = @request.auth.id` |
| PocketBase | API Rules `todo_items`: `listRule`/`viewRule` = `list.owner = @request.auth.id \|\| list.public = true`; `createRule`/`updateRule`/`deleteRule` = `list.owner = @request.auth.id` |
| Gateway (porta) | `packages/todo-domain/src/gateways/TodoListsGateway.ts` (nova interface: `listOwned()`, `create()`, `update()`, `remove()`, `get(id)`) + `packages/todo-domain/src/gateways/TodoListsPocketBaseGateway.ts` (implementação) — substitui o `TodoGateway` de lista única para o app runes |
| Domínio reativo | `apps/runes/src/lib/domain/TodoListsService.svelte.ts` (nova: gerencia múltiplas listas) — `TodoListService.svelte.ts` existente passa a operar sobre uma lista específica (por `id`), já carregada via `load` da rota |
| Server | `apps/runes/src/routes/todos/+page.server.ts` — `load` lista as listas do usuário logado |
| Server | `apps/runes/src/routes/todos/new/+page.server.ts` — `actions.default` cria lista (Zod: `title`) |
| Server | `apps/runes/src/routes/todos/[id]/+page.server.ts` — `load` resolve dono vs. leitor público (checagem server-side antes de retornar dados); `actions.updateTitle`, `actions.togglePublic`, `actions.delete`, `actions.addItem`, `actions.toggleItem`, `actions.removeItem` — todas checam posse antes de mutar |
| UI | `apps/runes/src/lib/components/TodoListsIndex.svelte`, `TodoListDetail.svelte` (modo edição para dono / modo leitura para visitante com `public=true`) |
| Validação | `apps/runes/src/lib/validation/todoSchemas.ts` — `createListSchema` (`title`), `addItemSchema` (`description`) (Zod) |

## Contrato de API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/todos` | — | Listas do usuário logado |
| POST (form action) | `/todos/new` | `title` | Redirect `/todos/[id]` ou `fail(400, {errors})` |
| GET | `/todos/[id]` | — | Dados da lista + itens (modo leitura ou edição conforme posse) ou 403 |
| POST (form action) | `/todos/[id]` (`updateTitle`) | `title` | `fail(400, {errors})` se não for dono |
| POST (form action) | `/todos/[id]` (`togglePublic`) | `public` | `fail(400)` se não for dono |
| POST (form action) | `/todos/[id]` (`delete`) | — | Redirect `/todos`; `fail(403)` se não for dono |
| POST (form action) | `/todos/[id]` (`addItem`/`toggleItem`/`removeItem`) | `description` / `itemId` | `fail(400, {errors})` ou `fail(403)` se não for dono |

## Alternativas consideradas

- **Compartilhamento por lista de convidados (relação N:N usuário↔lista)** em vez de flag `public` simples: mais flexível, mas o pedido foi explicitamente por um boolean público + link — mais simples de implementar e auditar, rejeitada a alternativa mais complexa por YAGNI.
- **Confiar só nas API Rules do PocketBase**, sem checagem server-side redundante no SvelteKit: reduz código, mas o pedido pediu validação "server-side caso possível" como camada adicional — mantida a dupla checagem para não depender de uma única superfície de segurança.

## Questões em aberto

- Nenhuma no momento.

## Links

- Jira (após aprovação da spec): `docs/workflow/2026-07-09-pocketbase-todo-sharing.jira.md`
- Feature doc (pós-implementação): `docs/features/2026-07-09-pocketbase-todo-sharing.md`
- PR: `docs/workflow/2026-07-09-pocketbase-todo-sharing.pr.md`
- Depende de: [`pocketbase-infra`](./2026-07-09-pocketbase-infra.md), [`pocketbase-auth`](./2026-07-09-pocketbase-auth.md)
- Specs relacionadas: [`pocketbase-user-crud`](./2026-07-09-pocketbase-user-crud.md)
