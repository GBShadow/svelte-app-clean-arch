# Correções no Kanban/Tiptap + Backlog Global do Planning Poker + Preservação de Remetente no Chat

> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Este PR reúne o trabalho acumulado na branch `docs/tech-debt-rule-and-spec-review`: duas correções de bugs reportados no Kanban/editor Tiptap (drag and drop revertendo cards e listas sem estilo visual), a adição do TaskList/TaskItem ao editor compartilhado, e duas features já especificadas (`docs/specs/`) que estavam em andamento — preservação do remetente no histórico do chat e o backlog global de tarefas do Planning Poker com ciclo de vida de sala.

## Tipo de mudança

- [x] Nova funcionalidade
- [x] Correção de bug
- [ ] Refatoração
- [x] Documentação
- [x] Chore / tooling

## Alterações

### Correção — Import de ícones lucide-svelte + config órfã
- `apps/runes/vite.config.ts` — remove `resolve.preserveSymlinks: true` órfão (resíduo de dependência `todo-domain` já removida).
- Ícones trocados de import barrel para sub-path (`lucide-svelte/icons/<nome>`) em `appRegistry.ts`, `CardDeck.svelte`, `ParticipantsList.svelte`, `VoteResults.svelte` — evita compilar os ~1700 ícones do pacote.
- `.cursor/rules/architecture/icon-library-imports.mdc` + `.agents/skills/icon-library-imports.md` — nova regra registrando o padrão.

### Correção — Drag and drop do Kanban revertendo cards
- `apps/runes/src/routes/kanban/+page.svelte` — array `board.cards` compartilhado (mutado durante o `consider` de cada zona) trocado por `Record<string, KanbanCardRecord[]>` local por coluna, e checagem de trigger corrigida para `TRIGGERS.DROPPED_INTO_ZONE` (oficial da lib `svelte-dnd-action`).

### Correção — Listas do Tiptap sem estilo + TaskList/TaskItem
- `apps/runes/src/app.css`, `apps/runes/package.json`, `pnpm-lock.yaml` — instalado e registrado `@tailwindcss/typography` (a classe `prose` não fazia nada sem o plugin).
- `apps/runes/src/lib/components/kanban/RichTextEditor.svelte` — extensões `TaskList`/`TaskItem` (`@tiptap/extension-list`) com botão na toolbar.
- `apps/runes/src/lib/server/richTextSanitize.ts` (novo) — allowlist compartilhada de `sanitize-html` para o TaskList sobreviver à sanitização, aplicada em `kanban/+page.server.ts`, `poker/backlog/+page.server.ts` e `poker/[roomId]/+page.server.ts`.

### Feature — Preservar remetente do chat (`docs/specs/chat-sender-preservar.md`)
- `apps/runes/src/routes/chat/[roomId]/+page.server.ts` — resolve remetentes órfãos (removidos da sala) via `fetchAuthParticipants`, com fallback "Usuário removido".
- `apps/runes/src/routes/chat/[roomId]/+page.svelte` — combina participantes ativos + remetentes órfãos num único mapa de resolução.
- `apps/runes/e2e/chat.spec.ts` — cobertura E2E do cenário.

### Feature — Backlog global e ciclo de vida da sala do Planning Poker (`docs/specs/poker-backlog-global.md`)
- `pocketbase/pb_migrations/0017_poker_backlog_global.js` — campo `status` em `poker_rooms`, `is_global_backlog` em `poker_tasks`.
- `apps/runes/src/routes/poker/backlog/` (novo) — tela de backlog global (admin).
- `apps/runes/src/lib/domain/planningPokerAccess.ts` — `canEditGlobalTask`, `canDeleteGlobalTask`, `canLinkGlobalTasks`, `canFinalizeRoom`; `canVote` agora considera `roomStatus`.
- `apps/runes/src/lib/components/planning-poker/TaskEditor.svelte` (edição de tarefa) e `TaskList.svelte` (ações "Remover Votação"/"Editar", layout responsivo dos filtros).
- `apps/runes/src/lib/server/pokerRecord.ts`, `apps/runes/src/lib/validation/pokerSchemas.ts`, `apps/runes/src/routes/poker/+page.server.ts`, `apps/runes/src/routes/poker/+page.svelte`, `apps/runes/src/routes/poker/[roomId]/+page.server.ts`, `apps/runes/src/routes/poker/[roomId]/+page.svelte`.
- `apps/runes/e2e/planning-poker.spec.ts` — cobertura E2E.

### Testes
- `apps/runes/src/lib/domain/PlanningPokerRoom.test.ts`, `planningPokerAccess.test.ts` — fixtures atualizadas para os novos campos `status`/`is_global_backlog`.

### Documentação
- `docs/features/kanban.md` — Decisões de design nº 5 (drag and drop) e nº 6 (listas/TaskList/sanitize).
- `docs/CHANGELOG.md`, `docs/CODE-STRUCTURE.md`.

## Test plan

- [x] `pnpm test` — 169 testes unitários passando (`todo-domain` + `runes`).
- [x] `pnpm check` — 0 erros de tipagem (corrigidos 9 erros pré-existentes: `AuthParticipant` não importado, fixtures de teste sem campos obrigatórios, `onSaveTask` obrigatório sem default, acesso a `.title`/`.description` em união de tipos de erro de form action).
- [x] Teste manual com navegador real (Playwright): drag and drop de card entre colunas com verificação do payload de rede e persistência no PocketBase; toggle de lista com marcador/numeração visíveis; criação de TaskList com checkbox marcado, salvo e persistido corretamente no banco.

## Documentação

- Specs: [docs/specs/chat-sender-preservar.md](../specs/chat-sender-preservar.md), [docs/specs/poker-backlog-global.md](../specs/poker-backlog-global.md)
- Feature: [docs/features/kanban.md](../features/kanban.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

Nenhuma.

## Issues / Jira

- Jira: [docs/workflow/poker-backlog-global.jira.md](./poker-backlog-global.jira.md), [docs/workflow/chat-sender-preservar.jira.md](./chat-sender-preservar.jira.md)
