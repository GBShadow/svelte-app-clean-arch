# Documentos de Especificação

> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Sistema de documentos markdown por projeto com permissões granulares (ver / ver e editar), tags relacionais com autocomplete, filtros por nome e tag, toggle de preview, criação de tasks vinculadas no backlog global que preservam o vínculo spec → task → card kanban após exportação do poker.

## Tipo de mudança

- [x] Nova funcionalidade
- [ ] Correção de bug
- [ ] Refatoração
- [ ] Documentação
- [ ] Chore / tooling

## Alterações

### PocketBase
- `0023_create_spec_collections.js` — 3 coleções (spec_documents, spec_tags, spec_document_permissions) + source_spec em poker_tasks e kanban_cards

### Domínio
- `apps/runes/src/lib/domain/specAccess.ts` — canViewDocument, canEditDocument, canDeleteDocument, canManagePermissions, filterDocumentsByAccess

### Server
- `apps/runes/src/lib/server/specRecord.ts` — tipos SpecDocumentRecord, SpecTagRecord, SpecPermissionRecord, SpecDocumentWithTags
- `apps/runes/src/lib/server/pokerRecord.ts` (+source_spec)
- `apps/runes/src/lib/server/kanbanRecord.ts` (+source_spec)

### Validação
- `apps/runes/src/lib/validation/specSchemas.ts` — Zod schemas (5 schemas)

### API (server actions)
- `routes/projects/[projectId]/specs/+page.server.ts` — listagem + criar doc
- `routes/projects/[projectId]/specs/[docId]/+page.server.ts` — documento individual + update, delete, togglePublic, addPermission, removePermission, createTask
- `routes/poker/[roomId]/+page.server.ts` — exportToKanban copia source_spec

### UI
- `routes/projects/[projectId]/specs/+page.svelte` — listagem com abas, filtros
- `routes/projects/[projectId]/specs/[docId]/+page.svelte` — editor markdown, toggle preview, permissões, tasks vinculadas
- `lib/components/specs/SpecPermissionManager.svelte`
- `lib/components/specs/SpecTaskCreator.svelte`

### Testes
- `lib/domain/KanbanBoard.test.ts` — adicionado source_spec: null nas fixtures
- `lib/domain/PlanningPokerRoom.test.ts` — adicionado source_spec: null nas fixtures

## Test plan

- [x] `pnpm test` — 321 testes passando
- [x] `pnpm check` — sem erros do meu código
- [ ] Teste manual: criar documento, alternar abas, filtrar, conceder permissões, testar link público, criar task e verificar source_spec, exportar do poker

## Documentação

- Spec: [docs/specs/2026-07-24-specification-documents.md](../specs/2026-07-24-specification-documents.md)
- Feature: [docs/features/2026-07-24-specification-documents.md](../features/2026-07-24-specification-documents.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

Nenhuma.

## Issues / Jira

- Jira: [JIRA-KEY] — [docs/workflow/2026-07-24-specification-documents.jira.md](./2026-07-24-specification-documents.jira.md)
