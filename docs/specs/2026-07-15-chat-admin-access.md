# Acesso de Admin ao Chat

Created: 2026-07-15


## Contexto

Usuários com `isAdmin: true` na collection `auth` do PocketBase recebem erro 500 ao acessar a rota `/chat/[roomId]` de salas nas quais não são participantes.

Causa raiz: as API Rules do PocketBase (`listRule`/`viewRule`) de `chat_rooms` e `chat_messages` verificam apenas `participants.id ?= @request.auth.id`, sem considerar o campo `isAdmin`. Quando um admin autenticado tenta ler uma sala onde não está em `participants`, o PocketBase lança erro 403 que, no caminho do `load` do SvelteKit, resulta em erro 500 não tratado (ou 404 mascarado pelo `catch` genérico).

## Objetivo

Permitir que usuários admin acessem **todas** as salas de chat e mensagens, independentemente de participarem da sala.

## Escopo

**Incluído:**
- Migration PocketBase para atualizar `listRule` e `viewRule` de `chat_rooms` e `chat_messages` adicionando `@request.auth.isAdmin = true`
- Ajuste no domínio puro (`chatRoomAccess.ts`) para incluir `isAdmin` na verificação de acesso
- Ajuste nos `load` de `/chat/+page.server.ts` (listar todas as salas para admin) e `/chat/[roomId]/+page.server.ts` (permitir acesso à sala para admin)
- Testes unitários de domínio puro para a nova regra `isAdmin`

**Fora do escopo:**
- UI de administração de salas (criação/remoção em massa)
- Auditoria de ações de admin no chat

## Requisitos funcionais

- RF1: Admin autenticado (`locals.user.isAdmin === true`) deve conseguir listar todas as salas em `/chat`
- RF2: Admin autenticado deve conseguir acessar qualquer sala via `/chat/[roomId]`
- RF3: Usuário não-admin continua restrito às salas onde é participante
- RF4: Regras de API PocketBase refletem a mesma lógica (defesa em profundidade)

## Requisitos não funcionais

- **Segurança**: Regra de admin só concede leitura; escritas (criar mensagem, adicionar participante) continuam exigindo participação/criação da sala — não há escalação de privilégio para escrita
- **Realtime**: Token de impersonação retornado no `load` continua válido para subscriptions; admin recebe token do próprio usuário (não superuser)
- **Testes**: Cobertura unitária pura em `chatRoomAccess.test.ts` para `isParticipant` com `isAdmin`

## Critérios de aceite

- [ ] AC1: Dado admin logado, quando acessa `/chat`, então vê todas as salas (não apenas as que participa)
- [ ] AC2: Dado admin logado, quando acessa `/chat/<roomId>` de sala onde não participa, então carrega a sala sem erro 500/403
- [ ] AC3: Dado usuário não-admin logado, quando acessa `/chat/<roomId>` de sala onde não participa, então recebe 403
- [ ] AC4: Testes unitários em `chatRoomAccess.test.ts` cobrem cenários com `isAdmin: true/false`

## Design (Ports & Adapters — padrão real do projeto)

> **Nota:** o app `runes` **não** usa a abstração `Gateway`/`HttpGateway`/`MemoryGateway` de `packages/todo-domain` para features PocketBase. O padrão real (como em `chat-realtime`) faz mutações via _form actions_ (`+page.server.ts` chamando `locals.pb`), com lógica de autorização isolada em funções puras (`$lib/domain/...`) e estado reativo consumindo subscriptions (`.svelte.ts`).

| Camada | Mudança prevista |
|--------|-------------------|
| PocketBase | Migration `00XX_allow_admin_chat_access.js`: atualiza `listRule` e `viewRule` de `chat_rooms` e `chat_messages` para `participants.id ?= @request.auth.id \|\| @request.auth.isAdmin = true` |
| Domínio (função pura) | `apps/runes/src/lib/domain/chatRoomAccess.ts` — adicionar parâmetro `isAdmin` em `isParticipant` / nova função `canAccessRoom(room, userId, isAdmin)` + testes |
| Domínio reativo (client) | Nenhuma — subscriptions usam token do usuário autenticado |
| Server (types) | Nenhuma — tipos em `chatRecord.ts` permanecem |
| Validação | Nenhuma — schemas de mensagem/participante inalterados |
| API | `apps/runes/src/routes/chat/+page.server.ts` (load): remover filtro `participants.id ?= userId` quando `locals.user.isAdmin`<br>`apps/runes/src/routes/chat/[roomId]/+page.server.ts` (load): permitir acesso se `locals.user.isAdmin` antes de checar participação |
| UI | Nenhuma mudança visual |

## Contrato de API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/chat` | — | `{ rooms: [...], userId }` (admin vê todas) |
| GET | `/chat/[roomId]` | — | `{ room, messages, orphanSenders, userId, pbToken, pbRecord }` (admin acessa qualquer sala) |

## Alternativas consideradas

1. **Usar admin client (superuser) para buscar dados do admin** — Rejeitada: vaza dados de todas as salas para o client do admin, quebra isolamento e realtime (token de impersonação seria do superuser).
2. **Criar collection separada "admin_chat_rooms"** — Rejeitada: duplicação desnecessária; regra `isAdmin` no PocketBase é nativa e performática.
3. **Apenas corrigir no SvelteKit (sem migration PocketBase)** — Rejeitada: defesa em profundidade exige regra no banco; sem migration, admin autenticado via API direta (ex: script) ainda seria bloqueado.

## Questões em aberto

- Nenhuma — regra `isAdmin` já existe na collection `auth` (migration `0001_create_auth_collection.js`)

## Links

- Jira (após aprovação da spec): `docs/workflow/2026-07-15-chat-admin-access.jira.md`
- Feature doc (pós-implementação): `docs/features/2026-07-15-chat-admin-access.md`
- PR: `docs/workflow/chat-admin-access.pr.md`
- Spec relacionada: [`2026-07-10-chat-realtime.md`](./2026-07-10-chat-realtime.md)
