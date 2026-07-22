# Projetos, Sprints e Contexto no Kanban + Planning Poker

Created: 2026-07-21

## Resumo

Adiciona camada de **projetos** (CRUD com participantes/responsáveis), **sprints** (ciclos planned/active/finished) e contextualiza o Kanban e o Planning Poker por projeto + sprint.

## Arquivos Modificados/Criados

### PocketBase
- `pocketbase/pb_migrations/0021_create_projects_sprints.js` — novas coleções `projects`, `sprints`; campos project/sprint em `kanban_columns`, `kanban_cards`; campo project em `poker_rooms`; seed projeto "Geral"

### Server Types
- `apps/runes/src/lib/server/projectRecord.ts` — `ProjectRecord`, `SprintRecord`
- `apps/runes/src/lib/server/kanbanRecord.ts` — +project, +sprint em `KanbanColumnRecord`, `KanbanCardRecord`
- `apps/runes/src/lib/server/pokerRecord.ts` — +project em `PokerRoomRecord`

### Domain Logic
- `apps/runes/src/lib/domain/projectAccess.ts` — funções de acesso e gerenciamento de projetos/sprints
- `apps/runes/src/lib/domain/projectAccess.test.ts` — 18 testes
- `apps/runes/src/lib/domain/KanbanBoard.svelte.ts` — +project, +activeSprint, +plannedSprint state; filtro por project.id em cards

### Validation
- `apps/runes/src/lib/validation/projectSchemas.ts` — createProject, updateProject, createSprint, addParticipant schemas
- `apps/runes/src/lib/validation/kanbanSchemas.ts` — +projectId, +sprintId nos schemas de card/column
- `apps/runes/src/lib/validation/pokerSchemas.ts` — +projectId em createRoomSchema

### Routes
- `apps/runes/src/routes/projects/+page.server.ts` — listagem de projetos
- `apps/runes/src/routes/projects/+page.svelte` — grid de projetos
- `apps/runes/src/routes/projects/new/+page.server.ts` — criar projeto + colunas padrão
- `apps/runes/src/routes/projects/new/+page.svelte` — formulário de criação
- `apps/runes/src/routes/projects/[id]/+page.server.ts` — detalhe: sprints, participantes, CRUD
- `apps/runes/src/routes/projects/[id]/+page.svelte` — UI de sprints e participantes
- `apps/runes/src/routes/projects/[id]/edit/+page.server.ts` — editar projeto
- `apps/runes/src/routes/projects/[id]/edit/+page.svelte` — formulário de edição
- `apps/runes/src/routes/kanban/+page.server.ts` — load filtrado por projeto + sprint; todas actions com project context
- `apps/runes/src/routes/kanban/+page.svelte` — seletor de projeto, sprint info, filtros, sprint nos modais
- `apps/runes/src/routes/poker/+page.server.ts` — +project selector no createRoom
- `apps/runes/src/routes/poker/+page.svelte` — +project selector no modal de criação, exibição nas salas
- `apps/runes/src/routes/poker/[roomId]/+page.server.ts` — exportToKanban usa project.sprint alvo

### App Registry
- `apps/runes/src/lib/appRegistry.ts` — +Projetos entry

## Decisões de Design

1. **Sprint Status**: `planned | active | finished` em vez de `finished: boolean` + `started: boolean` — mais semântico e extensível.
2. **Cards sem sprint**: sprint é opcional no card. Cards sem sprint (backlog) aparecem sempre no board. Útil para backlog geral do projeto.
3. **Apenas 1 sprint ativa por vez**: simplifica a lógica de exibição. Sprint ativa é a única com `status=active` no projeto.
4. **Auto-criação da próxima sprint**: ao finalizar a atual, a próxima é criada como `planned` com base na data de fim + 1 dia.
5. **Poker vinculado a projeto**: export usa a sprint ativa (ou planned) do projeto, nunca uma sprint finalizada.
6. **Admin global para criação**: apenas usuários com `isAdmin=true` podem criar projetos. Responsáveis do projeto gerenciam participantes.
7. **Rota `/kanban?project=xxx`**: mantém a rota existente, adiciona query param. Se não houver projeto, redireciona para `/projects`.
