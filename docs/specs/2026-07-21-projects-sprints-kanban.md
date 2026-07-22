# Projetos, Sprints e Contexto no Kanban + Planning Poker

Created: 2026-07-21

## Contexto

O Kanban e o Planning Poker operam atualmente sem contexto de projeto — todas as tasks e colunas são globais. Não há suporte a sprints (ciclos de trabalho com início/fim), nem separação entre projetos. Tasks votadas no Poker vão para um backlog global sem vínculo com sprint ou projeto.

## Objetivo

Adicionar camada de **projetos** (CRUD com participantes/responsáveis), **sprints** (ciclos planned/active/finished) vinculadas a projetos, e contextualizar o Kanban e o Planning Poker por projeto + sprint.

## Escopo

**Incluído:**
- CRUD de projetos (título*, descrição*, imagem opcional, participantes, responsáveis)
- Sprints com status `planned | active | finished`, auto-criação da próxima ao finalizar
- Cards do Kanban filtrados por projeto + sprint ativa (cards de sprints finalizadas ocultos)
- Seletor de projeto no Kanban (`/kanban?project=xxx`)
- Planning Poker vinculado a projeto (seletor na criação, export direcionado à sprint)
- Migration 0021: novas coleções + seed de dados existentes

**Fora do escopo:**
- Relatórios/burndown de sprint
- Permissões granulares por sprint (apenas por projeto)
- Integração com calendário externo

## Impactos e Dependências

- **Features existentes afetadas:** Kanban (rota, load, actions, UI), Planning Poker (criação de sala, exportToKanban)
- **Dívida técnica existente relacionada:** N/A
- **Dependências:** Migration 0021 deve rodar antes do deploy
- **Specs relacionadas:** 2026-07-12-kanban.md, 2026-07-12-planning-poker.md

## Requisitos funcionais

- RF1: Admin global pode criar projetos com título e descrição
- RF2: Responsáveis do projeto podem gerenciar participantes
- RF3: Participantes do projeto podem ver o projeto e acessar seu Kanban
- RF4: Sprints têm status planned → active → finished
- RF5: Ao finalizar sprint ativa, próxima é auto-criada como planned
- RF6: Cards de sprints finished não aparecem no board
- RF7: Cards sem sprint (backlog) sempre aparecem no board
- RF8: Kanban tem seletor de projeto no topo
- RF9: Planning Poker exige seleção de projeto na criação
- RF10: Export do Poker vai para a sprint ativa (ou planned) do projeto

## Requisitos não funcionais

- **Segurança**: Projetos usam API Rules do PocketBase com verificação de participante/responsável/admin. Cards herdam visibilidade do projeto.
- **Realtime**: KanbanBoard.svelte.ts filtra cards pelo `project.id` para evitar vazamento entre projetos.

## Design (Ports & Adapters)

| Camada | Mudança |
|--------|---------|
| PocketBase | Migration `0021`: `projects`, `sprints`, + campos em `kanban_columns`, `kanban_cards`, `poker_rooms` |
| Domínio (função pura) | `projectAccess.ts` (canViewProject, canManageProject, getTargetSprint, etc.) |
| Domínio reativo (client) | `KanbanBoard.svelte.ts` — filtro por projeto + sprint, suporte a project/sprint state |
| Server (types) | `projectRecord.ts` (ProjectRecord, SprintRecord), update `kanbanRecord.ts`, `pokerRecord.ts` |
| Validação | `projectSchemas.ts`, update `kanbanSchemas.ts` (+projectId, +sprintId), `pokerSchemas.ts` (+projectId) |
| API | `routes/projects/*`, update `routes/kanban/+page.server.ts`, `routes/poker/+page.server.ts`, `routes/poker/[roomId]/+page.server.ts` |
| UI | `routes/projects/*`, update `routes/kanban/+page.svelte`, `routes/poker/+page.svelte` |

## UI/UX (Estados)

| Estado | Comportamento |
|--------|---------------|
| **Loading** | Skeleton do SvelteKit (já existente) |
| **Empty** | "Nenhum projeto" com CTA para criar |
| **Error** | Alert inline no formulário |
| **Success** | Redirect para página do projeto |
| **Offline** | N/A (requer servidor) |
