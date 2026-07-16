# Preservar Remetente do Chat (chat-sender-preservar)

Created: 2026-07-12


## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | Medium |
| Labels | sveltekit, ports-adapters, runes, chat, pocketbase |
| Story Points | 2 |
| Jira Key | [JIRA-KEY] |
| Epic | Melhorias do Chat |

## Description

### Contexto

Atualmente, quando um participante é removido de uma sala de chat, ele perde o acesso à sala (comportamento correto). No entanto, o seu nome e avatar desaparecem do feed de histórico de mensagens para os demais participantes. Isso ocorre porque o componente da interface (`+page.svelte`) resolve o remetente de cada mensagem consultando `participantsById`, que é derivado dos participantes ativos da sala de chat (`data.room.expand.participants`).

### Objetivo

Garantir que as informações de remetente (nome e avatar) das mensagens enviadas por participantes que foram posteriormente removidos ou que saíram da sala permaneçam visíveis no feed de histórico de mensagens.

### Escopo

**Incluído:**
- Alteração no `load` de `apps/runes/src/routes/chat/[roomId]/+page.server.ts` para buscar as mensagens utilizando o cliente administrativo (`admin`), expandindo a relação `sender` (`expand: 'sender'`) e limitando os campos retornados da coleção `auth` a `id`, `name`, `avatar`.
- Ajuste no componente de UI `apps/runes/src/routes/chat/[roomId]/+page.svelte` para obter as informações de exibição do remetente a partir da relação expandida na mensagem (`message.expand?.sender`) com fallback para o mapa de participantes ativos (`participantsById.get(message.sender)`).

**Fora do escopo:**
- Modificação nas regras de API da coleção `auth` do PocketBase para o cliente regular.
- Armazenamento redundante ou desnormalizado de dados do usuário nas mensagens.

## Acceptance Criteria

- [ ] AC1: Dado uma sala de chat com mensagens de múltiplos participantes, quando um participante for removido da sala, então as mensagens que ele enviou antes de ser removido devem continuar exibindo o nome e o avatar do usuário.
- [ ] AC2: Dado um participante removido de uma sala, quando ele tentar acessar a URL da sala, então o servidor deve retornar status `403 Forbidden` e impedir a visualização das mensagens.
- [ ] AC3: Dado uma mensagem nova recebida via PocketBase realtime subscription, quando o remetente for um participante ativo da sala, então o nome e o avatar devem ser exibidos imediatamente no feed com base no mapa local de participantes da sala.
- [ ] `pnpm test` e `pnpm check` sem erros.
- [ ] Documentação em `docs/features/2026-07-12-chat-sender-preservar.md`.

## Technical Notes (Ports & Adapters — runes)

| Camada | Ação |
|--------|------|
| Server | `apps/runes/src/lib/server/chatRecord.ts` (tipo `ChatMessageRecord` já suporta `expand.sender`) |
| API | `apps/runes/src/routes/chat/[roomId]/+page.server.ts` (usar cliente admin no load com `expand: 'sender'` e `fields` restritos) |
| UI | `apps/runes/src/routes/chat/[roomId]/+page.svelte` (resolver remetente usando `message.expand?.sender ?? participantsById.get(message.sender)`) |

## Links

- Spec: `docs/specs/2026-07-12-chat-sender-preservar.md`
- Feature doc: `docs/features/2026-07-12-chat-sender-preservar.md`
- PR (após implementação): `docs/workflow/chat-sender-preservar.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks (opcional)

- [ ] API: Implementar busca de mensagens com expand de sender via cliente admin no server load
- [ ] UI: Ajustar a exibição de remetente no feed de mensagens para consumir a relação expandida
- [ ] Testes: Validar permissões e fluxo de exibição localmente
- [ ] Documentação + PR
