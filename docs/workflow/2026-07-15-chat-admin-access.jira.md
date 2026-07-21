# Jira: chat-admin-access

Created: 2026-07-15


## Jira Key
[JIRA-KEY]

## Resumo
Corrigir erro 500 ao admin acessar rota de chat — admin não deve ver salas onde não participa (mesmo comportamento de não-admin), mas deve receber 403 adequado em vez de 500.

## Contexto
Usuários com `isAdmin: true` na collection `auth` recebem erro 500 ao acessar `/chat/[roomId]` de salas onde não são participantes. O comportamento correto: **ninguém (admin ou não) vê salas onde não participa**; o bug é o erro 500 em vez de 403 adequado.

## Objetivo
- Admin recebe 403 (não 500) ao tentar acessar sala onde não participa
- Lista `/chat` continua filtrando por participante (admin vê apenas suas salas)
- Regras PocketBase mantêm consistência (defesa em profundidade)

## Escopo
**Incluído:**
- Migration PocketBase: `listRule`/`viewRule` de `chat_rooms` e `chat_messages` mantêm apenas `participants.id ?= @request.auth.id` (sem `isAdmin`)
- Domínio: `chatRoomAccess.ts` mantém lógica de participação (sem `isAdmin`)
- API: `/chat/+page.server.ts` e `/chat/[roomId]/+page.server.ts` retornam 403 adequado para não-participantes (incluindo admin)
- Testes unitários

**Fora do escopo:**
- UI de administração de salas
- Auditoria de ações de admin no chat

## Critérios de Aceite
- [ ] AC1: Dado admin logado, quando acessa `/chat`, então vê apenas salas onde participa
- [ ] AC2: Dado admin logado, quando acessa `/chat/<roomId>` de sala onde não participa, então recebe 403 (não 500)
- [ ] AC3: Dado usuário não-admin logado, quando acessa `/chat/<roomId>` de sala onde não participa, então recebe 403
- [ ] AC4: Testes unitários em `chatRoomAccess.test.ts` cobrem cenários de participação
- [ ] AC5: `pnpm test` e `pnpm check` passam sem erros
- [ ] AC6: Documentação em `docs/features/2026-07-15-chat-admin-access.md`

## Design (Ports & Adapters — runes)

| Camada | Mudança |
|--------|---------|
| PocketBase | Migration `00XX_fix_chat_access_error.js`: **não alterar** `listRule`/`viewRule` (já correto: `participants.id ?= @request.auth.id`). O fix é no SvelteKit para retornar 403 adequado |
| Domínio (função pura) | `apps/runes/src/lib/domain/chatRoomAccess.ts` — manter `isParticipant` sem `isAdmin`; garantir que erro lançado seja 403 consistente |
| Domínio reativo (client) | Nenhuma |
| Server (types) | Nenhuma |
| Validação | Nenhuma |
| API | `apps/runes/src/routes/chat/+page.server.ts` (load): manter filtro por participante<br>`apps/runes/src/routes/chat/[roomId]/+page.server.ts` (load): garantir que erro de não-participante retorna 403, não 500 |
| UI | Nenhuma mudança visual |

## Subtasks
- [ ] Migration PocketBase: verificar rules atuais (já corretas)
- [ ] Domínio: revisar `chatRoomAccess.ts` (sem mudança de lógica)
- [ ] API: `/chat/+page.server.ts` (load) - confirmar filtro correto
- [ ] API: `/chat/[roomId]/+page.server.ts` (load) - corrigir tratamento de erro para 403
- [ ] Testes: `pnpm test` e `pnpm check`
- [ ] Documentação: `docs/features/2026-07-15-chat-admin-access.md`

## Links
- Spec: `docs/specs/2026-07-15-chat-admin-access.md`
- Feature doc: `docs/features/2026-07-15-chat-admin-access.md`
- PR: `docs/workflow/chat-admin-access.pr.md`
