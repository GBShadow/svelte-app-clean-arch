# Retrospectiva de Sprint

> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Quadro de retrospectiva anônimo por sprint com colunas configuráveis, cards rich text, token de edição anônimo (SHA-256), realtime via PocketBase subscriptions, DnD, lista de participantes gerenciada pelo responsável, moderação, finalização com zeramento de tokens e notificações.

## Tipo de mudança

- [x] Nova funcionalidade
- [x] Correção de bug (reatividade UI + createCard 403 + SpecTaskCreator lista stale)
- [ ] Refatoração
- [x] Documentação (skill `client-realtime-and-actions`)
- [ ] Chore / tooling

## Alterações

### PocketBase
- `0022_create_retro_collections.js` — 4 coleções: retrospectives, retrospective_participants, retrospective_columns, retrospective_cards

### Domínio
- `apps/runes/src/lib/domain/retroAccess.ts` — funções de permissão
- `apps/runes/src/lib/domain/RetroBoard.svelte.ts` — classe reativa com $state, subscriptions realtime, strip de edit_token_hash
- `apps/runes/src/lib/server/editToken.ts` — generateEditToken (32 bytes + SHA-256), verifyEditToken

### Server
- `apps/runes/src/lib/server/retroRecord.ts` — tipos das coleções
- `apps/runes/src/lib/server/notificationStore.ts` — createRetroFinalizedNotification
- `apps/runes/src/lib/domain/notification.ts` — tipo `retro` adicionado

### Validação
- `apps/runes/src/lib/validation/retroSchemas.ts` — Zod schemas (11 schemas)

### API (server actions)
- `routes/projects/[projectId]/sprints/[sprintId]/retro/+page.server.ts` — load + 12 actions

### UI
- `routes/projects/[projectId]/sprints/[sprintId]/retro/+page.svelte` — board principal
- `lib/components/retro/RetroColumn.svelte` — coluna com DnD
- `lib/components/retro/RetroCard.svelte` — card com edição/exclusão via token
- `lib/components/retro/RetroParticipants.svelte` — gerenciamento de participantes

### App Registry
- `apps/runes/src/lib/appRegistry.ts` — entry `retro`

## Test plan

- [x] `pnpm test` — 321 testes passando
- [x] `pnpm check` — sem erros do meu código (apenas pré-existentes em webPush.test.ts)
- [ ] Teste manual: criar retro, adicionar participantes, criar cards, verificar token no localStorage, editar/excluir com token, testar 403 sem token, moderar como responsável, finalizar, verificar bloqueio

## Documentação

- Spec: [docs/specs/2026-07-24-sprint-retrospective.md](../specs/2026-07-24-sprint-retrospective.md)
- Feature: [docs/features/2026-07-24-sprint-retrospective.md](../features/2026-07-24-sprint-retrospective.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

Nenhuma.

## Issues / Jira

- Jira: [JIRA-KEY] — [docs/workflow/2026-07-24-sprint-retrospective.jira.md](./2026-07-24-sprint-retrospective.jira.md)
