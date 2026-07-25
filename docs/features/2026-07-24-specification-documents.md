# Documentos de Especificação

Created: 2026-07-24

## Resumo

Sistema de documentos markdown por projeto com permissões granulares (ver / ver e editar), tags relacionais com autocomplete, filtros por nome e tag, toggle de preview, criação de tasks vinculadas no backlog global que preservam o vínculo spec → task → card kanban após exportação do poker.

## App(s) afetado(s)

runes

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| PocketBase | `pocketbase/pb_migrations/0023_create_spec_collections.js` |
| Domínio | `apps/runes/src/lib/domain/specAccess.ts` |
| Server | `apps/runes/src/lib/server/specRecord.ts`, `pokerRecord.ts` (+source_spec), `kanbanRecord.ts` (+source_spec) |
| Validação | `apps/runes/src/lib/validation/specSchemas.ts` |
| API | `apps/runes/src/routes/projects/[projectId]/specs/+page.server.ts`, `specs/[docId]/+page.server.ts` |
| API (poker) | `apps/runes/src/routes/poker/[roomId]/+page.server.ts` (exportToKanban copia source_spec) |
| UI | `routes/projects/[projectId]/specs/+page.svelte`, `specs/[docId]/+page.svelte`, `lib/components/specs/` (SpecPermissionManager, SpecTaskCreator) |
| Testes | `lib/domain/KanbanBoard.test.ts`, `PlanningPokerRoom.test.ts` (fixtures atualizadas) |

## Fluxo (Ports & Adapters)

Listagem: load server-side → PocketBase query filtrando por permissões (server-side) → UI com abas "Minhas" / "Com acesso" + filtro nome/tag.
Documento: load server-side → verifica acesso (dono, permissão, ou link público) → editor markdown com toggle preview.
Task vinculada: editor → form createTask → `poker_tasks.source_spec = docId` → poker export copia para `kanban_cards.source_spec`.

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/projects/{pid}/specs?/createDoc` | Cria documento |
| POST | `/projects/{pid}/specs/{id}?/updateDoc` | Atualiza documento + tags |
| POST | `?/deleteDoc` | Exclui documento |
| POST | `?/togglePublic` | Liga/desliga link público |
| POST | `?/addPermission` | Adiciona/atualiza permissão view/edit |
| POST | `?/removePermission` | Remove permissão |
| POST | `?/createTask` | Cria task no backlog global vinculada |

## Como testar

```bash
pnpm test
pnpm check
```

Cenários manuais: criar documento, alternar abas, filtrar por nome/tag, conceder permissão view/edit, testar link público, criar task e verificar vinculação, exportar task via poker e verificar source_spec no kanban.

## Decisões de design

- **Tags relacionais (`spec_tags`)**: tabela separada em vez de JSON array, para permitir filtro server-side via PocketBase.
- **Unique pair via campo `pair`**: `docId:userId` com `unique: true` + verificação server-side, já que PocketBase não suporta unique composto nativo.
- **Cascade delete**: `spec_documents.project` com `cascadeDelete: true` — documentos morrem com o projeto.
- **Permissões server-side**: `filterDocumentsByAccess` usado no load para não expor metadados de documentos que o usuário não pode ver.
- **Sanitização dupla**: `svelte-markdown` + sanitize-html server-side para XSS.
- **SpecTaskCreator com form + enhance**: a lista de tasks vem de `data.linkedTasks` no load. Criar task via `fetch` sem `update()`/`invalidateAll` deixa a lista stale até F5. O componente usa `<form method="POST" action="?/createTask" use:enhance>` e chama `await update()` no sucesso. Ver skill `client-realtime-and-actions`.
