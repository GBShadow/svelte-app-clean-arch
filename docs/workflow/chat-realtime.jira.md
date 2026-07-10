# Chat em tempo real com avatar de usuário (runes)

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | Medium |
| Labels | sveltekit, ports-adapters, runes, pocketbase, realtime |
| Story Points | 8 |
| Jira Key | [JIRA-KEY] |
| Epic | _(opcional)_ |

## Description

### Contexto

`apps/runes` não tem nenhuma forma de comunicação entre usuários — toda interação com o backend é request/response. O PocketBase já é usado como backend e tem suporte nativo a realtime que ainda não é aproveitado. Também não existe campo de avatar no usuário.

### Objetivo

Usuário autenticado consegue conversar em salas de chat de texto (1:1 ou grupo) com outros usuários autenticados, com mensagens em tempo real via realtime do PocketBase, e pode definir um avatar de perfil (armazenado localmente no PocketBase por enquanto).

### Escopo

**Incluído:**
- Campo `avatar` na coleção `auth`, editável pelo próprio usuário em `/profile`
- Novo app "Chat" no App Hub (`/chat`)
- Salas de chat 1:1 e grupo, com nome opcional
- Criação de sala por qualquer usuário autenticado, escolhendo participantes
- Sair da sala (qualquer participante); adicionar/remover participantes (só o criador); se o criador sair, o papel passa automaticamente para o participante restante mais antigo
- Mensagens de texto imutáveis, até 2000 caracteres
- Listagem de salas com preview da última mensagem + horário
- Histórico paginado (últimas 50 + scroll para carregar mais)
- Realtime client-side via SDK do PocketBase
- Dupla validação de participação (API Rules + server-side SvelteKit)

**Fora do escopo:**
- Upload de avatar para bucket externo
- Edição/exclusão de mensagens
- Anexos, reações, "digitando...", confirmação de leitura, contador de não lidas
- Push notifications (Jira separado: `chat-notifications`)
- Chamadas de voz/vídeo

## Acceptance Criteria

- [ ] AC1: Dado um usuário autenticado sem avatar, quando envia uma imagem válida em `/profile`, então o avatar passa a ser exibido nas telas de chat.
- [ ] AC2: Dado um usuário autenticado, quando envia um arquivo inválido (formato/tamanho fora do permitido) em `/profile`, então recebe erro de validação e o avatar não muda.
- [ ] AC3: Dado um usuário sem salas, quando acessa `/chat`, então vê lista vazia com opção de criar sala.
- [ ] AC4: Dado um usuário autenticado, quando cria uma sala escolhendo 2 outros participantes, então a sala aparece em `/chat` para os 3.
- [ ] AC5: Dado dois participantes com a mesma sala aberta em abas diferentes, quando um envia mensagem, então ela aparece para o outro sem recarregar a página.
- [ ] AC6: Dado um usuário que não é participante de uma sala, quando tenta acessar `/chat/[roomId]` diretamente, então recebe acesso negado.
- [ ] AC7: Dado um participante (não criador), quando tenta adicionar/remover outro participante, então a operação é rejeitada.
- [ ] AC8: Dado um participante qualquer, quando escolhe "sair da sala", então deixa de vê-la em `/chat` e para de receber mensagens dela.
- [ ] AC9: Dado uma sala com mais de 50 mensagens, quando o usuário rola até o topo, então mensagens mais antigas são carregadas.
- [ ] AC10: Dado o criador de uma sala com outros participantes, quando ele sai, então o papel de criador passa para o participante restante mais antigo.
- [ ] AC11: Dado um remetente que acabou de enviar uma mensagem, quando o evento de realtime da própria mensagem chega, então ela não aparece duplicada na tela.
- [ ] AC12: Dado um usuário não-admin, quando acessa `/chat/new`, então vê a lista de todos os outros usuários disponíveis como participantes.
- [ ] Testes unitários cobrindo `chatRoomAccess.ts` (autorização, transferência de criador) e `ChatMessagesFeed.svelte.ts` (dedup, merge)
- [ ] `pnpm test` e `pnpm check` sem erros
- [ ] Documentação em `docs/features/chat-realtime.md`

## Technical Notes (padrão real do projeto — ver nota na spec)

> O app `runes` não usa a abstração `Gateway`/`HttpGateway`/`MemoryGateway` de `todo-domain` para features PocketBase (resquício de versão anterior). Segue o padrão real de `pocketbase-todo-sharing`: `locals.pb` direto em `+page.server.ts` + funções puras de autorização testadas isoladamente.

| Camada | Ação |
|--------|------|
| PocketBase | Migration `chat_rooms` (`name`, `created_by`, `participants` relation multi — ordem de inserção preservada, sempre append no fim), `chat_messages` (`room`, `sender`, `text` máx. 2000, `updateRule`/`deleteRule` = `null`), campo `avatar` (file) na coleção `auth` (regra de auto-edição de `0007` é blocklist e já permite `avatar` sem alteração); API Rules `chat_rooms.updateRule` = `created_by = @request.auth.id \|\| participants.id ?= @request.auth.id` (permissiva; granularidade fina — só criador adiciona/remove outros, participante comum só remove a si mesmo — garantida no server-side) |
| PocketBase | Migration abre `user.listRule`/`viewRule` para `@request.auth.id != ''` (picker de participantes do RF4); `auth.listRule`/`viewRule` permanecem restritas |
| Domínio (função pura) | `apps/runes/src/lib/domain/chatRoomAccess.ts` (`isParticipant`, `isCreator`, `nextCreatorAfter`) + testes, padrão `todoListAccess.ts` |
| Domínio reativo (client) | `apps/runes/src/lib/domain/ChatMessagesFeed.svelte.ts` (`$state`, `subscribe` injetável, dedup por `id`) + testes com fake |
| Server | `apps/runes/src/lib/server/chatRecord.ts` (types), `authLookup.ts` (`findAuthRecordByEmail`, extraído do padrão duplicado em `users/[id]/edit`), `userAvatar.ts` (validação de upload) |
| API | `apps/runes/src/routes/chat/+page.server.ts`, `chat/new/+page.server.ts`, `chat/[roomId]/+page.server.ts` (mutações via `locals.pb` direto), `profile/+page.server.ts` |
| Client | `apps/runes/src/lib/client/pocketbaseClient.ts` (factory: PocketBase browser-side com `PUBLIC_POCKETBASE_URL` já existente + `pb.authStore.save(token, model)` a partir do token devolvido pelo `load` — primeira vez que um client PocketBase autenticado é instanciado no browser neste projeto) |
| UI | `ChatRoomList.svelte` (renderiza `data.rooms`, sem container), `ChatRoomView.svelte` (usa `ChatMessagesFeed` via `onMount`), `AvatarUpload.svelte`, `Avatar.svelte` |
| Validação | `apps/runes/src/lib/validation/chatSchemas.ts`, `avatarSchema` |
| Testes | `chatRoomAccess.test.ts`, `ChatMessagesFeed.test.ts` |

## Links

- Spec: `docs/specs/chat-realtime.md`
- Feature doc: `docs/features/chat-realtime.md`
- PR (após implementação): `docs/workflow/chat-realtime.pr.md`
- Depende de: `pocketbase-auth`, `pocketbase-user-crud`
- Relacionado: `chat-notifications` (consome o realtime desta feature)
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks (opcional)

- [ ] Migrations PocketBase (`chat_rooms`, `chat_messages`, campo `avatar` em `auth`, abertura de `user.listRule`/`viewRule`) + API Rules
- [ ] `chatRoomAccess.ts` (funções puras de autorização/transferência de criador) + testes
- [ ] `ChatMessagesFeed.svelte.ts` (domínio reativo client-side, dedup) + testes com `subscribe` fake
- [ ] `pocketbaseClient.ts` (factory client-side autenticado)
- [ ] Types (`chatRecord.ts`), `authLookup.ts` (resolução e-mail → id de `auth`), `userAvatar.ts` (validação de upload) + validação Zod
- [ ] Rotas `/chat`, `/chat/new`, `/chat/[roomId]`, `/profile` (load + actions)
- [ ] UI (listagem de salas, view da sala, upload de avatar, componente Avatar)
- [ ] Novo card "Chat" no App Hub (`appRegistry`)
- [ ] Testes e2e (Playwright): criar sala, enviar mensagem, realtime entre duas abas, controle de acesso
- [ ] Documentação (`docs/features/chat-realtime.md`) + PR
