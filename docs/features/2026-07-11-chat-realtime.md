# Chat em tempo real com avatar de usuário (runes)

Created: 2026-07-11


## Resumo

Usuário autenticado de `apps/runes` conversa em salas de chat (1:1 ou grupo) com outros usuários autenticados, com mensagens aparecendo em tempo real via subscription client-side do PocketBase SDK, e pode definir uma foto de avatar (armazenada localmente no PocketBase) exibida ao lado do nome em qualquer tela de chat. Segue o mesmo padrão real já usado em `pocketbase-todo-sharing` — `locals.pb` direto em `+page.server.ts`, autorização isolada em funções puras testadas isoladamente — e não a abstração `Gateway`/`HttpGateway`/`MemoryGateway` de `packages/todo-domain`.

## App(s) afetado(s)

- **runes** — `/profile`, `/chat`, `/chat/new`, `/chat/[roomId]`, card "Chat" no App Hub

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Infra (PocketBase) | `pocketbase/pb_migrations/0011_create_chat_collections.js` — coleções `chat_rooms`/`chat_messages` + API Rules |
| Infra (PocketBase) | `pocketbase/pb_migrations/0012_add_avatar_to_auth.js` — campo `avatar` (file, máx. 2MB, jpg/png/webp) na coleção `auth` |
| Infra (PocketBase) | `pocketbase/pb_migrations/0013_open_user_listing_for_authenticated.js` — abre `user.listRule`/`viewRule` para qualquer autenticado (picker de participantes) |
| Domínio (função pura) | `apps/runes/src/lib/domain/chatRoomAccess.ts` (+ `chatRoomAccess.test.ts`) — `isParticipant`, `isCreator`, `nextCreatorAfter` |
| Domínio reativo (client) | `apps/runes/src/lib/domain/ChatMessagesFeed.svelte.ts` (+ `ChatMessagesFeed.test.ts`) — classe `$state` que mescla histórico do `load` com eventos de subscription (injetável), dedup por `id` |
| Validação | `apps/runes/src/lib/validation/chatSchemas.ts` (+ `chatSchemas.test.ts`) — `createRoomSchema`, `sendMessageSchema`, `avatarSchema` |
| Server (types) | `apps/runes/src/lib/server/chatRecord.ts` — `ChatRoomRecord`, `ChatMessageRecord`, `AuthParticipant` |
| Server (admin) | `apps/runes/src/lib/server/pocketbaseAdmin.ts` — `getAdminClient()`, cliente PocketBase superusuário (autenticado via `_superusers`, cacheado em memória), só server-side |
| Server (lookup) | `apps/runes/src/lib/server/authLookup.ts` — `findAuthRecordByEmail(email)`, resolve e-mail → registro `auth` via cliente superusuário |
| Server (expand) | `apps/runes/src/lib/server/authExpand.ts` — `fetchAuthParticipants(ids)`, resolve nome/avatar de participantes/remetentes via cliente superusuário |
| Server (avatar) | `avatarSchema` validado em `profile/+page.server.ts` antes do upload |
| Server (avatar em locals) | `apps/runes/src/lib/server/authUser.ts` (+ `avatar` em `AuthenticatedUser`), `apps/runes/src/hooks.server.ts` (popula `locals.user.avatar`) |
| Client | `apps/runes/src/lib/client/pocketbaseClient.ts` — `createBrowserClient(token, record)`, primeiro cliente PocketBase autenticado instanciado no browser neste projeto |
| API | `apps/runes/src/routes/profile/+page.server.ts` + `+page.svelte` — load + action `uploadAvatar` |
| API | `apps/runes/src/routes/chat/+page.server.ts` + `+page.svelte` — load (salas do usuário + preview da última mensagem, participantes resolvidos via `fetchAuthParticipants`) |
| API | `apps/runes/src/routes/chat/new/+page.server.ts` + `+page.svelte` — load (lista de usuários para o picker) + action de criação de sala |
| API | `apps/runes/src/routes/chat/[roomId]/+page.server.ts` + `+page.svelte` — load (histórico + participantes + token de impersonation de curta duração) + actions `sendMessage`/`leaveRoom`/`addParticipant`/`removeParticipant` |
| UI | `apps/runes/src/lib/components/Avatar.svelte` — imagem ou iniciais como placeholder |
| App Hub | `apps/runes/src/lib/appRegistry.ts` — entrada `chat` (ícone `MessageCircle` de `lucide-svelte`) |
| Testes E2E | `apps/runes/e2e/chat.spec.ts` (+ `cleanupChatRoom` em `apps/runes/e2e/cleanup.ts`) |

## Fluxo (Ports & Adapters — padrão real do projeto)

```
/chat (load)
  → getFullList('chat_rooms') filtrado por participants.id ?= self
  → fetchAuthParticipants(todos os ids de participantes das salas) via cliente superusuário
    [locals.pb não consegue expandir participants → auth porque auth.viewRule
     restringe a "próprio registro ou admin"; expand: 'participants' não retorna nada
     para os demais participantes — corrigido com um lookup explícito via admin client]
  → busca a última mensagem de cada sala (preview) e ordena por atividade recente

/chat/new (load)
  → getFullList('user') — aberto para qualquer autenticado pela migration 0013
(actions.default)
  → valida createRoomSchema (Zod)
  → resolve cada e-mail escolhido para um id de auth via findAuthRecordByEmail
  → cria chat_rooms { name?, created_by: self, participants: [self, ...escolhidos] }
    [createRule do PocketBase exige @request.body.created_by = @request.auth.id]
  → redirect /chat/[roomId]

/chat/[roomId] (load)
  → getOne('chat_rooms') sem expand + fetchAuthParticipants(room.participants)
  → isParticipant(...) → error(403) se não for participante
  → getList('chat_messages', 50, sort: -created) + reverse (histórico)
  → getAdminClient().collection('auth').impersonate(userId, 600s)
    → token de curta duração devolvido ao client (pbToken/pbRecord) para abrir a
      subscription realtime sem expor a sessão completa do usuário ao browser

/chat/[roomId] (+page.svelte, client)
  → ChatMessagesFeed(roomId, data.messages, subscribeFn)
  → subscribeFn: createBrowserClient(pbToken, pbRecord) → pb.collection('chat_messages')
    .subscribe('*', ..., { filter: 'room = "<roomId>"' })
  → onMount: feed.start(); onDestroy: feed.stop() (unsubscribe)
  → $effect: feed.sync(data.messages) a cada revalidação do load
  → dedup por id: evento de create cujo id já esteja em feed.messages é ignorado
    (evita duplicar a própria mensagem enviada pelo remetente)

/chat/[roomId] actions
  → sendMessage: requireParticipant → cria chat_messages { room, sender: self, text }
  → leaveRoom: requireParticipant → remove self de participants;
      se era o criador, nextCreatorAfter(participants, self) transfere a posse
      para o próximo mais antigo restante; se não sobra ninguém, exclui a sala
  → addParticipant/removeParticipant: isCreator(...) → fail(403) se não for o criador;
      removeParticipant também bloqueia auto-remoção (usa "Sair da sala" em vez disso)
```

## API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/chat` | — | Lista de salas do usuário (nome, preview, horário) |
| POST (form action) | `/chat/new` | `participantIds[]` (e-mails), `name?` | Redirect `/chat/[roomId]` ou `fail(400, {errors})` |
| GET | `/chat/[roomId]` | — | Histórico paginado (últimas 50) + participantes ou `error(403/404)` |
| POST (form action) | `/chat/[roomId]` (`?/sendMessage`) | `text` | `{success:true}` ou `fail(400/403, {errors})` |
| POST (form action) | `/chat/[roomId]` (`?/leaveRoom`) | — | Redirect `/chat` |
| POST (form action) | `/chat/[roomId]` (`?/addParticipant`) | `email` | `{success:true}` ou `fail(400/403, {errors})` |
| POST (form action) | `/chat/[roomId]` (`?/removeParticipant`) | `userId` | `{success:true}` ou `fail(400/403, {errors})` |
| POST (form action) | `/profile` (`?/uploadAvatar`) | arquivo `avatar` | `{success:true}` ou `fail(400, {errors})` |

## Como testar

```bash
pnpm backend:reset   # aplica migrations 0011–0013 do zero
pnpm dev:full
pnpm test            # 119 testes (runes: 59, incluindo chatRoomAccess/chatSchemas/ChatMessagesFeed; todo-domain: 60)
pnpm check           # 0 erros (2 warnings pré-existentes, não bloqueantes, em chat/[roomId]/+page.svelte)
pnpm --filter runes test:e2e   # 12/12, incluindo chat.spec.ts (2 specs)
```

Cenários manuais/e2e cobertos:

- AC1/AC2: upload de avatar válido/inválido em `/profile` (`avatarSchema`: mimetype jpg/png/webp, máx. 2MB).
- AC3/AC4: `/chat` vazio com opção de criar sala; criação de sala com participante(s) via `/chat/new` — testado em `chat.spec.ts` criando um segundo usuário via `/users/new` e selecionando-o no picker (o seed de teste só tem o admin, e `createRoomSchema` exige ao menos 1 participante).
- AC5/AC11: duas abas/clientes na mesma sala — mensagem enviada aparece em tempo real na outra aba sem reload, sem duplicar na tela de quem enviou (dedup por `id` em `ChatMessagesFeed`).
- AC6: acesso direto a `/chat/[roomId]` por não-participante → `error(403)`.
- AC7: participante comum tentando `addParticipant`/`removeParticipant` → `fail(403)`.
- AC8: "Sair da sala" remove o usuário de `participants` e reflete em `/chat`.
- AC9: histórico paginado (últimas 50 mensagens, `sort: -created` + reverse).
- AC10: criador saindo com outros participantes restantes → `created_by` transferido via `nextCreatorAfter` (testado em `chatRoomAccess.test.ts`).
- AC12: `/chat/new` lista todos os outros usuários (nome/e-mail) para um usuário não-admin, habilitado pela migration `0013`.

## Decisões de design

- **Sem `ChatGateway`/`ChatMemoryGateway`/`ChatPocketBaseGateway`**: a spec já registrava essa alternativa descartada (ver "Alternativas consideradas" em `docs/specs/2026-07-10-chat-realtime.md`) — o app `runes` não usa a abstração `Gateway` de `packages/todo-domain` para features PocketBase; seguido o mesmo padrão de `pocketbase-todo-sharing` (`locals.pb` direto + funções puras de autorização testadas isoladamente).
- **Realtime client-side direto, não relay via SSE do servidor**: exige expor um token de autenticação ao browser (primeira vez neste projeto que um cliente PocketBase autenticado é instanciado no client), mas é o uso nativo do realtime do PocketBase e evita uma camada de infraestrutura extra — trade-off já registrado na spec.
- **Token de curta duração via `impersonate`, não o token de sessão completo**: descoberto durante a implementação — em vez de devolver `locals.pb.authStore.token` (sessão completa do usuário, de longa duração) ao client para abrir a subscription, o `load` de `/chat/[roomId]` usa `getAdminClient().collection('auth').impersonate(userId, 600)` para gerar um token de curta duração (10 min) escopado ao próprio usuário, reduzindo a superfície de exposição de um token de longa duração no browser.
- **`authExpand.ts` (`fetchAuthParticipants`) além de `authLookup.ts`**: descoberto durante a implementação — assim como `findAuthRecordByEmail` (spec já documentava essa descoberta para a Task 10), o `expand: 'participants'`/`expand: 'sender'` do PocketBase não retorna dados para outros usuários porque `auth.viewRule` permanece restrita a "próprio registro ou admin" (a `viewRule` também é aplicada aos registros expandidos, não só ao registro principal). Corrigido substituindo o `expand` embutido por uma resolução explícita via `fetchAuthParticipants`, usando o mesmo cliente superusuário de `pocketbaseAdmin.ts` — nenhum dado de `auth` além de `id`/`name`/`avatar` (o shape de `AuthParticipant`) chega às rotas ou ao client.
- **`removeParticipant` bloqueia auto-remoção**: a API Rule de `chat_rooms.updateRule` é propositalmente permissiva (`created_by = self || participants.id ?= self`, ver spec) para permitir tanto a gestão do criador quanto a auto-remoção via `leaveRoom`; a granularidade fina — só o criador remove **outros** participantes, um participante comum só remove a si mesmo (via `leaveRoom`, não via `removeParticipant`) — é garantida inteiramente na checagem server-side do SvelteKit, com `removeParticipant` retornando `fail(400)` explícito se `targetId === userId`, orientando o usuário a usar "Sair da sala".
- **Teste e2e ajustado em relação ao plano original**: o plano de implementação prévia (`docs/superpowers/plans/2026-07-10-2026-07-10-chat-realtime.md`) previa um cenário de "criar sala sem outros participantes", mas `createRoomSchema.participantIds.min(1)` exige ao menos um participante e o seed de teste e2e só tem o usuário admin — o teste final (`chat.spec.ts`) cria um segundo usuário via `/users/new` e o seleciona como participante antes de criar a sala, com limpeza (`cleanupChatRoom` + `cleanupUser`) em `finally`.
- **`chat_rooms.updateRule` restrita ao criador (migration `0014`)**: descoberto por revisão de segurança pós-push — a rule original do plano (`created_by = self || participants.id ?= self`) só verificava se o requisitante *era* participante, sem restringir *o que* ele podia alterar. Como esta feature expõe um cliente PocketBase autenticado no browser (`pocketbaseClient.ts`, para o realtime), qualquer participante tinha um token de sessão válido para chamar a API do PocketBase diretamente (fora do SvelteKit) e sobrescrever `participants`/`created_by` arbitrariamente — um IDOR com escalonamento de privilégio (virar "criador" da sala) e possibilidade de expulsar outros participantes, contornando por completo as checagens `isCreator`/`isParticipant` de `+page.server.ts`, que só protegem quem passa pela UI. Corrigido restringindo `updateRule` a `created_by = @request.auth.id` e movendo a escrita de `leaveRoom` (onde um participante comum precisa se remover) para o cliente superusuário (`getAdminClient()`), já que a autorização ali já é validada em código (`requireParticipant`) antes da chamada. Validado manualmente via API direta: tentativa de um participante comum se autopromover a criador retorna `404` (PocketBase usa 404 em vez de 403 para não revelar a existência do registro) e os dados da sala permanecem inalterados.
