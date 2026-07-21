# Chat em tempo real com avatar de usuário (runes)

Created: 2026-07-11


> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Adiciona salas de chat 1:1 e em grupo ao `apps/runes`, com mensagens de texto simples atualizadas em tempo real via subscription client-side do PocketBase SDK, e um avatar de perfil (jpg/png/webp, até 2MB) exibido ao lado do nome em qualquer tela de chat. Qualquer participante autenticado cria salas e sai delas; só o criador adiciona/remove outros participantes, com transferência automática de posse se ele sair.

## Tipo de mudança

- [x] Nova funcionalidade
- [ ] Correção de bug
- [ ] Refatoração
- [ ] Documentação
- [ ] Chore / tooling

## Alterações

### Backend (PocketBase)
- `pocketbase/pb_migrations/0011_create_chat_collections.js` — coleções `chat_rooms`/`chat_messages` + API Rules
- `pocketbase/pb_migrations/0012_add_avatar_to_auth.js` — campo `avatar` (file, máx. 2MB, jpg/png/webp) em `auth`
- `pocketbase/pb_migrations/0013_open_user_listing_for_authenticated.js` — abre listagem de `user` para qualquer autenticado (picker de participantes)
- `pocketbase/pb_migrations/0014_restrict_chat_room_update_rule.js` — restringe `chat_rooms.updateRule` ao criador (corrige IDOR: um participante comum, via chamada direta à API do PocketBase, conseguia sobrescrever `participants`/`created_by` e se autopromover a criador da sala)

### App(s)
- `apps/runes/src/lib/domain/chatRoomAccess.ts` — autorização e transferência de criador (funções puras)
- `apps/runes/src/lib/domain/ChatMessagesFeed.svelte.ts` — feed reativo (`$state`) com dedup por `id`
- `apps/runes/src/lib/validation/chatSchemas.ts` — `createRoomSchema`, `sendMessageSchema`, `avatarSchema`
- `apps/runes/src/lib/server/chatRecord.ts`, `authLookup.ts`, `authExpand.ts`, `pocketbaseAdmin.ts` — types, resolução e-mail→id e expand de participantes via cliente superusuário (resposta restrita a `id`/`name`/`avatar` via `fields`, sem vazar `email`/`isAdmin`/`mustChangePassword`/`passwordSetAt` de outros participantes)
- `apps/runes/src/lib/server/authUser.ts`, `apps/runes/src/hooks.server.ts` — `avatar` em `AuthenticatedUser`/`locals.user`
- `apps/runes/src/lib/client/pocketbaseClient.ts` — cliente PocketBase client-side autenticado (subscriptions realtime)
- `apps/runes/src/lib/components/Avatar.svelte` — avatar com placeholder de iniciais
- `apps/runes/src/routes/profile/`, `chat/`, `chat/new/`, `chat/[roomId]/` — rotas novas (load + actions); `leaveRoom` grava via cliente superusuário, já que a `updateRule` de `chat_rooms` agora restringe update ao criador
- `apps/runes/src/lib/appRegistry.ts` — entrada "Chat" no App Hub

### Testes
- `chatRoomAccess.test.ts`, `ChatMessagesFeed.test.ts`, `chatSchemas.test.ts` — unitários (Vitest)
- `apps/runes/e2e/chat.spec.ts` + `cleanupChatRoom` em `apps/runes/e2e/cleanup.ts` — e2e (Playwright): criação de sala com participante, envio de mensagem, saída da sala; validação de participantes vazios

## Test plan

- [x] `pnpm test` — 119 testes passando (runes: 59, incluindo os 3 arquivos novos de chat; todo-domain: 60)
- [x] `pnpm check` — 0 erros (2 warnings pré-existentes e não bloqueantes em `chat/[roomId]/+page.svelte`)
- [ ] `pnpm build`
- [x] `pnpm --filter runes test:e2e` — 12/12 passando, incluindo os 2 specs novos de chat
- [x] Teste manual: `pnpm dev:full` → criar sala em `/chat/new`, abrir a mesma sala em duas abas com usuários diferentes, enviar mensagem em uma e confirmar chegada em tempo real na outra sem duplicar na tela de quem enviou; testar acesso negado a `/chat/[roomId]` por não-participante; testar bloqueio de `addParticipant`/`removeParticipant` por não-criador; testar upload de avatar válido/inválido em `/profile`

## Documentação

- Spec: [docs/specs/2026-07-10-chat-realtime.md](../specs/2026-07-10-chat-realtime.md)
- Feature: [docs/features/2026-07-10-chat-realtime.md](../features/2026-07-10-chat-realtime.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

Nenhuma. `pocketbase/pb_migrations/0011`–`0013` são aditivas (novas coleções + novo campo em `auth` + relaxamento de `listRule`/`viewRule` de `user` para qualquer autenticado, sem afetar a coleção `auth`).

## Issues / Jira

- Closes #[issue]
- Jira: [JIRA-KEY] — [docs/workflow/2026-07-10-chat-realtime.jira.md](./2026-07-10-chat-realtime.jira.md)

## Screenshots

_(opcional — UI: listagem de salas, view de sala com mensagens em tempo real, upload de avatar em `/profile`)_
