# PR: Planning Poker em tempo real colaborativo (runes)

Created: 2026-07-12


> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Este PR implementa a funcionalidade de Planning Poker em tempo real colaborativo e síncrono. Usuários podem criar salas, gerenciar um backlog de tarefas, votar em rodadas síncronas usando o baralho Fibonacci (com sigilo total de votos a nível de banco de dados antes da revelação), pontuar as tarefas e exportá-las diretamente como novos cards na coluna de Backlog ("Aguardando") do Kanban.

## Tipo de mudança

- [x] Nova funcionalidade
- [ ] Correção de bug
- [ ] Refatoração
- [x] Documentação
- [ ] Chore / tooling

## Alterações

### Backend (PocketBase)
- `pocketbase/pb_migrations/0016_create_poker_collections.js`: Definição das coleções `poker_rooms`, `poker_tasks`, `poker_participants` e `poker_votes` com regras seguras e quebra de circularidade.

### App (runes)
- `apps/runes/src/lib/domain/planningPokerAccess.ts`: Lógica de validação de papéis, cálculo de médias e distribuição de votos.
- `apps/runes/src/lib/domain/PlanningPokerRoom.svelte.ts`: Estado reativo client-side com Svelte 5 Runes e SSE realtime.
- `apps/runes/src/lib/validation/pokerSchemas.ts`: Schemas Zod de validação.
- `apps/runes/src/routes/poker/`: Rota de listagem e criação de salas.
- `apps/runes/src/routes/poker/[roomId]`: Rota de sala colaborativa, com Form Actions, auto-join, e controle de presença online.
- `apps/runes/src/lib/components/planning-poker/`: Componentes modulares (`CardDeck.svelte`, `ParticipantsList.svelte`, `VoteResults.svelte`, `TaskList.svelte`, `TaskEditor.svelte`).

### Testes
- `apps/runes/src/lib/domain/planningPokerAccess.test.ts`: Testes de permissões e média/distribuição de votos.
- `apps/runes/src/lib/domain/PlanningPokerRoom.test.ts`: Testes unitários do estado reativo do poker.
- `apps/runes/src/lib/validation/pokerSchemas.test.ts`: Validações de schemas.
- `apps/runes/e2e/planning-poker.spec.ts`: Testes E2E cobrindo todo o fluxo da sala, votações, revelação, pontuação e exportação para o Kanban.

## Test plan

- [x] `pnpm test` (93 unit tests passed)
- [x] `pnpm check` (svelte-check passed with 0 errors)
- [x] `pnpm test:e2e` (15/15 Playwright E2E tests passed)

## Documentação

- Spec: [docs/specs/2026-07-12-planning-poker.md](../specs/2026-07-12-planning-poker.md)
- Feature: [docs/features/2026-07-12-planning-poker.md](../features/2026-07-12-planning-poker.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

Nenhuma.

## Issues / Jira

- Jira: [JIRA-KEY] — [docs/workflow/2026-07-12-planning-poker.jira.md](./2026-07-12-planning-poker.jira.md)
