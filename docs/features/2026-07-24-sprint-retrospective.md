# Retrospectiva de Sprint

Created: 2026-07-24

## Resumo

Quadro de retrospectiva anônimo por sprint, com colunas configuráveis, cards rich text com token de edição anônimo (SHA-256), DnD entre colunas, participação gerenciada por responsável, moderação, finalização com zeramento de tokens e notificações.

## App(s) afetado(s)

runes

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| PocketBase | `pocketbase/pb_migrations/0022_create_retro_collections.js` |
| Domínio | `apps/runes/src/lib/domain/retroAccess.ts`, `RetroBoard.svelte.ts`, `editToken.ts` |
| Server | `apps/runes/src/lib/server/retroRecord.ts`, `notificationStore.ts` (createRetroFinalizedNotification) |
| Validação | `apps/runes/src/lib/validation/retroSchemas.ts` |
| API | `apps/runes/src/routes/projects/[projectId]/sprints/[sprintId]/retro/+page.server.ts` |
| UI | `apps/runes/src/routes/projects/[projectId]/sprints/[sprintId]/retro/+page.svelte`, `lib/components/retro/` (RetroColumn, RetroCard, RetroParticipants) |
| Notificações | `apps/runes/src/lib/domain/notification.ts` (tipo `retro`) |
| App Registry | `apps/runes/src/lib/appRegistry.ts` |

## Fluxo (Ports & Adapters)

UI → onMount → RetroBoard (classe reativa `.svelte.ts`) → PocketBase subscriptions para realtime. Mutações via form actions (`+page.server.ts`) usando admin client.

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/projects/{pid}/sprints/{sid}/retro?/createRetro` | Cria retro + 3 colunas padrão |
| POST | `?/createColumn` | Cria coluna custom |
| POST | `?/renameColumn` | Renomeia coluna |
| POST | `?/reorderColumns` | Reordena colunas (DnD) |
| POST | `?/deleteColumn` | Exclui coluna (só vazia) |
| POST | `?/createCard` | Cria card, retorna `{ cardId, editToken }` |
| POST | `?/editCard` | Edita card (requer token) |
| POST | `?/deleteCard` | Exclui card (token ou moderação) |
| POST | `?/moveCard` | Move card entre colunas |
| POST | `?/addParticipant` | Adiciona participante |
| POST | `?/removeParticipant` | Remove participante |
| POST | `?/finalize` | Finaliza retro, zera tokens |

## Como testar

```bash
pnpm test
pnpm check
```

Cenários manuais: criar retro, adicionar participantes, criar/editar/mover cards com token, verificar 403 sem token, moderar como responsável, finalizar e verificar bloqueio.

## Decisões de design

- **Token anônimo (edit_token)**: hash SHA-256 no DB, token plano retornado uma vez ao client. Stripped de `edit_token_hash` na resposta do servidor e nos eventos realtime pela classe reativa. Anonimato real: nem o admin sabe quem criou qual card.
- **Rota explícita**: `/projects/[id]/sprints/[sprintId]/retro` em vez de auto-detecção, para clareza RESTful.
- **API Rules restritas**: `listRule`/`viewRule` verificam `project.participants`, impedindo vazamento de dados via API direta do PocketBase.
- **Criador é participante**: `createRetro` adiciona o responsável em `retrospective_participants` na mesma action — senão `createCard`/`moveCard` (que exigem participação) retornam 403 para quem acabou de criar a retro. Gestores também podem criar/mover cards mesmo fora da lista.
- **Board no padrão kanban**: `createBrowserClient(token, user)` (nunca `authStore.save(token, null)`), board no init + `$effect(() => board.sync(data…))` + `onMount(start)`. Mutations via `fetch` usam `deserialize` + headers de form action; fallback `invalidateAll` se realtime falhar. Ver skill `client-realtime-and-actions`.
