# Chat em tempo real com avatar de usuário (runes)

## Contexto

Hoje `apps/runes` não tem nenhuma forma de comunicação entre usuários — toda interação com o backend é request/response (forms, load functions). O PocketBase já é usado como backend e tem suporte nativo a realtime (subscriptions via SSE/WebSocket) que ainda não é aproveitado por nenhuma funcionalidade do app. Também não existe hoje nenhum campo de avatar no usuário — apenas dados textuais (nome, email, role).

## Objetivo

Usuário autenticado consegue conversar em salas de chat de texto simples (1:1 ou em grupo) com outros usuários autenticados, com mensagens aparecendo em tempo real via realtime do PocketBase, e pode definir uma foto de avatar para o próprio perfil (armazenada localmente no PocketBase por enquanto).

## Escopo

**Incluído:**

- Campo `avatar` (arquivo de imagem) na coleção `auth`, editável pelo próprio usuário em uma tela de perfil (`/profile`)
- Novo app "Chat" no App Hub, rota `/chat`
- Salas de chat (`chat_rooms`) suportando 1:1 e grupo (N participantes), com nome opcional (obrigatório só se quiser sobrescrever o nome padrão baseado nos participantes)
- Qualquer usuário autenticado pode criar uma sala e escolher os participantes iniciais
- Qualquer participante pode sair da sala; apenas quem criou a sala pode adicionar/remover outros participantes
- Mensagens de texto simples (`chat_messages`), imutáveis (sem editar/excluir), até 2000 caracteres
- Listagem de salas (`/chat`) com nome, preview da última mensagem e horário, ordenada por atividade recente
- Histórico paginado ao abrir uma sala (últimas 50 mensagens + carregar mais ao rolar para cima)
- Atualização em tempo real das mensagens via subscription client-side do SDK do PocketBase (`pb.collection('chat_messages').subscribe(...)`)
- Dupla validação de participação (API Rules do PocketBase + checagem server-side no SvelteKit), seguindo o padrão de [`pocketbase-todo-sharing`](./pocketbase-todo-sharing.md)

**Fora do escopo:**

- Upload de avatar para bucket externo (S3 etc.) — fica para uma spec futura; por enquanto o arquivo fica no storage local do PocketBase
- Edição ou exclusão de mensagens
- Anexos, reações, indicador de "digitando...", confirmação de leitura, contador de não lidas
- Push notifications de mensagem nova — coberto pela spec separada [`chat-notifications`](./chat-notifications.md)
- Chamadas de voz/vídeo

## Requisitos funcionais

- RF1: Usuário autenticado acessa `/profile` e faz upload/troca do próprio avatar (jpg/png/webp, até 2MB); o avatar anterior é substituído.
- RF2: O avatar do usuário aparece ao lado do nome em qualquer lugar que exiba o remetente de uma mensagem ou a lista de participantes de uma sala; sem avatar definido, mostra um placeholder padrão.
- RF3: Usuário autenticado vê em `/chat` a lista das salas das quais participa, ordenada pela atividade mais recente, com nome da sala (ou nome do outro participante, se 1:1), preview da última mensagem e horário.
- RF4: Usuário autenticado cria uma nova sala em `/chat/new`, escolhendo um ou mais outros usuários autenticados (a partir de uma listagem com nome/e-mail de todos os usuários) como participantes e, opcionalmente, um nome. Quem cria se torna automaticamente participante e "criador" da sala.
- RF5: Ao abrir uma sala (`/chat/[roomId]`), o usuário vê as últimas 50 mensagens e pode rolar para cima para carregar mensagens mais antigas.
- RF6: Participante de uma sala envia uma mensagem de texto (até 2000 caracteres); a mensagem é persistida e aparece imediatamente para todos os participantes com a sala aberta, via realtime do PocketBase, sem recarregar a página.
- RF7: Qualquer participante pode sair de uma sala — deixa de vê-la em `/chat` e para de receber suas mensagens.
- RF8: Apenas o criador da sala pode adicionar ou remover outros participantes (exceto a própria saída, que qualquer participante pode fazer).
- RF9: Usuário que não é participante de uma sala não consegue visualizar, enviar mensagens, nem se inscrever no realtime dela.
- RF10: Se o criador sair da sala e ainda houver outros participantes, o papel de criador é transferido automaticamente para o participante restante com maior tempo na sala (o próximo mais antigo depois do criador original), que passa a poder adicionar/remover participantes.

## Requisitos não funcionais

- Realtime via subscription client-side do PocketBase SDK — primeira vez que este projeto instancia um client PocketBase autenticado e abre conexão realtime diretamente do navegador (hoje tudo é server-side via `hooks.server.ts`/`locals.pb`). A variável `PUBLIC_POCKETBASE_URL` já existe (usada hoje em `$lib/server/pocketbase.ts`) e já é acessível no client (prefixo `PUBLIC_` do SvelteKit) — não precisa de nova variável. O que falta é expor o **token** de autenticação ao client: como o cookie de sessão é `httpOnly` (ver `hooks.server.ts`), o token precisa ser devolvido explicitamente pelo `load` de `/chat`/`/chat/[roomId]` (a partir de `locals.pb.authStore.token`, já disponível server-side) para o client chamar `pb.authStore.save(token, model)` antes de abrir a subscription.
- A ordem de inserção do campo `participants` (relation multi-valor) é preservada — novos participantes são sempre adicionados ao final do array, nunca reordenados — para permitir determinar "o participante mais antigo restante" (usado em RF10) sem precisar de uma coleção de junção com metadado de `joined_at` por participante.
- A lista reativa de mensagens de uma sala deduplica por `id`: um evento de realtime cujo `id` já esteja presente na lista (ex.: a própria mensagem que o remetente acabou de enviar via form action) é ignorado, evitando que a mensagem apareça duplicada na tela de quem a enviou.
- API Rules do PocketBase reforçam participação/posse como camada redundante à checagem server-side no SvelteKit; a granularidade fina de "participante comum só pode remover a si mesmo, não outros" (RF7 vs. RF8) é garantida pela checagem server-side no SvelteKit — a API Rule do PocketBase é propositalmente mais permissiva (ver Design) e não expressa sozinha essa distinção.
- A regra de auto-edição de `0007_restrict_self_update_fields.js` é uma *blocklist* (só bloqueia mudar `isAdmin`/`email`/`mustChangePassword`/`passwordSetAt` sem ser admin) — o campo `avatar` não está nela, então já fica editável pelo próprio usuário automaticamente assim que o campo existir na coleção, sem precisar alterar essa regra.
- Hoje nenhuma coleção permite que um usuário comum liste outros usuários (`user.listRule`/`viewRule` e `auth.listRule`/`viewRule` são "próprio registro ou admin" — ver `0005_user_auth_rules.js`), o que inviabilizaria o RF4 (escolher participantes) para não-admins. Uma nova migration abre `user.listRule`/`viewRule` para `@request.auth.id != ''` (qualquer autenticado lista nome/e-mail/cargo de todos os usuários); a coleção `auth` permanece restrita (não expõe `isAdmin`/`mustChangePassword`/`passwordSetAt` de outros usuários). Ao criar a sala, o servidor resolve o e-mail de cada participante escolhido para o `id` correspondente na coleção `auth` (reaproveitando o padrão de `findAuthRecordByUserEmail` já usado em `users/[id]/edit/+page.server.ts`), já que as relations de chat apontam para `auth`, não para `user`.
- Testes unitários cobrindo a lógica de autorização/transferência de criador em `chatRoomAccess.ts` (funções puras, sem PocketBase) e a lógica de dedup/merge de mensagens em `ChatMessagesFeed.svelte.ts` (injetando uma função `subscribe` fake), seguindo o padrão de `todoListAccess.test.ts` — sem depender do PocketBase real para os testes unitários.

## Critérios de aceite

- [ ] AC1: Dado um usuário autenticado sem avatar, quando ele envia uma imagem válida em `/profile`, então o avatar passa a ser exibido nas telas de chat.
- [ ] AC2: Dado um usuário autenticado, quando ele envia um arquivo inválido (formato ou tamanho fora do permitido) em `/profile`, então recebe erro de validação e o avatar não é alterado.
- [ ] AC3: Dado um usuário sem salas, quando acessa `/chat`, então vê lista vazia com opção de criar uma sala.
- [ ] AC4: Dado um usuário autenticado, quando cria uma sala escolhendo 2 outros participantes, então a sala aparece em `/chat` para os 3 participantes.
- [ ] AC5: Dado dois participantes com a mesma sala aberta em abas diferentes, quando um envia uma mensagem, então ela aparece na tela do outro sem recarregar a página.
- [ ] AC6: Dado um usuário que não é participante de uma sala, quando tenta acessar `/chat/[roomId]` diretamente, então recebe acesso negado.
- [ ] AC7: Dado um participante (não criador) de uma sala, quando tenta adicionar/remover outro participante, então a operação é rejeitada.
- [ ] AC8: Dado um participante qualquer, quando escolhe "sair da sala", então deixa de vê-la em `/chat` e para de receber novas mensagens dela.
- [ ] AC9: Dado uma sala com mais de 50 mensagens, quando o usuário rola para o topo do histórico, então mensagens mais antigas são carregadas.
- [ ] AC10: Dado o criador de uma sala com outros participantes, quando ele sai da sala, então o papel de criador passa para o participante restante mais antigo, que passa a poder adicionar/remover participantes.
- [ ] AC11: Dado um remetente que acabou de enviar uma mensagem, quando o evento de realtime da própria mensagem chega pela subscription, então ela não aparece duplicada na tela.
- [ ] AC12: Dado um usuário autenticado não-admin, quando acessa `/chat/new`, então vê a lista de todos os outros usuários (nome/e-mail) disponíveis para escolher como participantes.
- [ ] Testes unitários cobrindo `chatRoomAccess.ts` (autorização, transferência de criador) e `ChatMessagesFeed.svelte.ts` (dedup por id, merge de mensagens via `subscribe` fake).

## Design (Ports & Adapters — padrão real do projeto, ver nota abaixo)

> **Nota:** o app `runes` **não** usa hoje a abstração `Gateway`/`HttpGateway`/`MemoryGateway` de `packages/todo-domain` para features PocketBase — isso é resquício de uma versão anterior do projeto (single global todo list). A feature mais próxima e recente (`pocketbase-todo-sharing`, rotas `/todos`) chama `locals.pb.collection(...)` diretamente em `+page.server.ts`, com a lógica de autorização isolada em funções puras testadas isoladamente (`$lib/domain/todoListAccess.ts`). Este design segue esse padrão real, não o descrito em `runes-ports-adapters.mdc`/`pocketbase-todo-sharing.md` (que ficaram desatualizados face à implementação real).

| Camada | Mudança prevista |
|--------|-------------------|
| PocketBase | Migration cria `chat_rooms` (`name` text opcional, `created_by` relation → `auth` required maxSelect 1, `participants` relation multi → `auth` required, `created`/`updated` autodate) |
| PocketBase | Migration cria `chat_messages` (`room` relation → `chat_rooms` required maxSelect 1 cascadeDelete, `sender` relation → `auth` required maxSelect 1, `text` text required máx. 2000 chars, `created`/`updated` autodate) |
| PocketBase | Migration adiciona campo `avatar` (file, single, máx. 2MB, mimetypes `image/jpeg`, `image/png`, `image/webp`) à coleção `auth` — a regra de auto-edição (`0007_restrict_self_update_fields.js`) é uma blocklist que não menciona `avatar`, então nenhuma mudança de regra é necessária |
| PocketBase | Migration abre `user.listRule`/`viewRule` para `@request.auth.id != ''` (qualquer autenticado lista/vê nome, e-mail e cargo de todos os usuários — necessário para o picker de participantes do RF4); `auth.listRule`/`viewRule` permanecem inalteradas (só próprio registro ou admin) |
| PocketBase | API Rules `chat_rooms`: `listRule`/`viewRule` = `participants.id ?= @request.auth.id`; `createRule` = `@request.auth.id != '' && @request.body.created_by = @request.auth.id`; `updateRule` = `created_by = @request.auth.id \|\| participants.id ?= @request.auth.id` (permissiva — permite que o criador gerencie participantes e que qualquer participante edite a sala para se auto-remover; a checagem server-side no SvelteKit garante que só o criador adicione/remova **outros** participantes, e que um participante comum só remova a si mesmo); `deleteRule` = `created_by = @request.auth.id` |
| PocketBase | API Rules `chat_messages`: `listRule`/`viewRule` = `room.participants.id ?= @request.auth.id`; `createRule` = `room.participants.id ?= @request.auth.id && @request.body.sender = @request.auth.id`; `updateRule`/`deleteRule` = `null` (bloqueado até para o dono — só superusuário, mesma convenção usada em `0005_user_auth_rules.js` para campos travados) |
| Domínio (função pura) | `apps/runes/src/lib/domain/chatRoomAccess.ts` (`isParticipant`, `isCreator`, `nextCreatorAfter(participantIds, leavingId)` — usada em RF10) + `chatRoomAccess.test.ts`, seguindo o padrão de `todoListAccess.ts`/`todoListAccess.test.ts` |
| Domínio reativo (client) | `apps/runes/src/lib/domain/ChatMessagesFeed.svelte.ts` — classe com `$state` que recebe as mensagens já carregadas pelo `load` e uma função `subscribe(roomId, onMessage)` injetável (permite fake nos testes); dedup por `id` ao mesclar mensagens novas (RNF de dedup) |
| Server (types) | `apps/runes/src/lib/server/chatRecord.ts` (`ChatRoomRecord`, `ChatMessageRecord`, análogos a `todoRecord.ts`) |
| Server (lookup) | `apps/runes/src/lib/server/authLookup.ts` (`findAuthRecordByEmail`, extraído do padrão hoje duplicado localmente em `users/[id]/edit/+page.server.ts`, reutilizado para resolver participantes escolhidos por e-mail para IDs de `auth`) |
| Server (avatar) | `apps/runes/src/lib/server/userAvatar.ts` (validação de mimetype/tamanho antes de repassar ao PocketBase) |
| API | `apps/runes/src/routes/chat/+page.server.ts` (load: `locals.pb.collection('chat_rooms').getFullList` filtrado por participação, com `expand: 'participants'` para nome/avatar) |
| API | `apps/runes/src/routes/chat/new/+page.server.ts` (load: lista `user` completo, exceto o próprio, para o picker; action: resolve e-mails escolhidos para IDs de `auth` via `resolveAuthIdByEmail` e cria a sala com `created_by`/`participants` incluindo o próprio usuário) |
| API | `apps/runes/src/routes/chat/[roomId]/+page.server.ts` (load: histórico paginado + participantes expandidos + `pb.authStore.token` na `PageData` para o client autenticar a subscription; actions: `sendMessage`, `leaveRoom` — usa `chatRoomAccess.nextCreatorAfter` quando o criador sai —, `addParticipant`, `removeParticipant`) |
| API | `apps/runes/src/routes/profile/+page.server.ts` (load + action `uploadAvatar`, opera sobre `locals.pb.authStore.record.id` na coleção `auth`) |
| Client | `apps/runes/src/lib/client/pocketbaseClient.ts` (factory: cria um `PocketBase` browser-side com `PUBLIC_POCKETBASE_URL` — já existente — e `pb.authStore.save(token, model)` a partir do token devolvido pelo `load`, usado por `ChatMessagesFeed` para abrir a subscription realtime) |
| UI | `ChatRoomList.svelte` (renderiza `data.rooms`, sem container — mutações via form actions), `ChatRoomView.svelte` (usa `ChatMessagesFeed` no client via `onMount`), `AvatarUpload.svelte`, `Avatar.svelte` (exibição com placeholder) |
| Validação | `apps/runes/src/lib/validation/chatSchemas.ts` (`createRoomSchema`, `sendMessageSchema` com máx. 2000 chars), `avatarSchema` (mimetype/tamanho) |

## Contrato de API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/chat` | — | Lista de salas do usuário |
| POST (form action) | `/chat/new` | `participantIds[]`, `name?` | Redirect `/chat/[roomId]` ou `fail(400, {errors})` |
| GET | `/chat/[roomId]` | `?before=<messageId>` | Histórico paginado + participantes ou 403 |
| POST (form action) | `/chat/[roomId]` (`sendMessage`) | `text` | `fail(400, {errors})` se inválido ou não participante |
| POST (form action) | `/chat/[roomId]` (`leaveRoom`) | — | Redirect `/chat` |
| POST (form action) | `/chat/[roomId]` (`addParticipant`/`removeParticipant`) | `userId` | `fail(403)` se não for o criador |
| POST (form action) | `/profile` (`uploadAvatar`) | arquivo `avatar` | `fail(400, {errors})` se formato/tamanho inválido |

## Alternativas consideradas

- **Coleção de junção `chat_room_participants` (N:N)** em vez de campo relation multi-valor em `chat_rooms`: mais normalizado e permitiria metadados por participante (ex.: `joined_at` individual, útil para a transferência de criador do RF10), mas para o escopo atual o campo relation multi-valor é suficiente desde que a ordem de inserção seja preservada (ver RNF) — YAGNI; revisar para uma coleção de junção se no futuro for necessário metadado por participante mais robusto que a ordem do array.
- **Realtime via relay do servidor (SSE do SvelteKit)** em vez de subscription client-side direta: evitaria expor token de auth ao browser, mas adiciona uma camada de infraestrutura extra e não é o uso nativo do PocketBase realtime — optou-se pela conexão direta do client, mais simples e alinhada ao pedido explícito de "usar o real-time do PocketBase".
- **`ChatGateway`/`ChatMemoryGateway`/`ChatPocketBaseGateway`** (porta e adaptadores genéricos, como em `packages/todo-domain`): foi a primeira versão deste Design, mas não corresponde ao padrão realmente usado pela feature PocketBase mais recente e comparável (`pocketbase-todo-sharing`), que chama `locals.pb` diretamente e isola só a lógica de autorização em funções puras. Trocado por esse padrão mais simples e consistente com o restante do código — evita reintroduzir uma camada de abstração que o projeto já abandonou na prática.

## Questões em aberto

- Estilo do placeholder de avatar (iniciais vs. ícone genérico) fica a critério da implementação/UI.

## Links

- Jira (após aprovação da spec): `docs/workflow/chat-realtime.jira.md`
- Feature doc (pós-implementação): `docs/features/chat-realtime.md`
- PR: `docs/workflow/chat-realtime.pr.md`
- Depende de: [`pocketbase-auth`](./pocketbase-auth.md), [`pocketbase-user-crud`](./pocketbase-user-crud.md)
- Specs relacionadas: [`chat-notifications`](./chat-notifications.md) (consome o realtime desta spec)
