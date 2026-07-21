# Backlog Global e Gerenciamento do Ciclo de Vida da Sala (poker-backlog-global)

Created: 2026-07-12


## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | High |
| Labels | sveltekit, ports-adapters, runes, pocketbase, planning-poker, kanban |
| Story Points | 5 |
| Jira Key | [JIRA-KEY] |
| Epic | Planning Poker |

## Description

### Contexto

Atualmente, as salas de Planning Poker operam de forma isolada no sistema. Todas as tarefas para estimativa precisam ser criadas manualmente dentro de cada sala, não existindo um local centralizado para gerenciar um backlog global de tarefas que possam ser importadas para múltiplas sessões. Além disso, as salas não possuem controle de estado formalizado (como "Aberta" vs "Finalizada"), permitindo a exportação para o Kanban a qualquer momento. Por fim, faltam funcionalidades para editar tarefas em votação, remover tarefas de votação resetando votos e corrigir o layout de filtros responsivos.

### Objetivo

Implementar um Backlog Global de tarefas do Planning Poker gerenciável por administradores, permitindo que responsáveis por salas vinculem essas tarefas globais às suas salas (na criação ou durante a sessão). Introduzir o ciclo de vida da sala (`status` como "Aberta" ou "Finalizada"), com regras estritas para exportação e remoção/edição de tarefas, e ajustar a UI de filtros para layouts responsivos.

### Escopo

**Incluído:**
- Nova tela de Backlog Global em `/poker/backlog` (acessível pelo hub `/poker`).
- Controle de acesso no Backlog Global: apenas administradores do sistema (`locals.user.isAdmin === true`) podem criar, editar e excluir tarefas. Usuários comuns apenas visualizam.
- Mecanismo de vínculo de tarefas do Backlog Global a salas de poker (atualização do campo `room` em `poker_tasks`).
- Bloqueio de edição/exclusão de tarefas do Backlog Global que já estejam vinculadas a alguma sala de poker.
- Novo campo `status` em `poker_rooms` (valores: `open`, `finalized`).
- Ação de finalizar a sala: apenas o responsável pode finalizar. Uma vez finalizada, a sala fica em modo de leitura (sem novas tarefas, sem novas votações, sem novos vínculos).
- Exportação para o Kanban permitida **apenas** quando a sala estiver no status `finalized`. O responsável pode exportar todas as tarefas estimadas ou selecionar um subconjunto.
- Ação para remover uma tarefa da votação (retornando-a ao backlog local da sala e limpando seus votos), disponível apenas se a sala estiver aberta.
- Ação de edição de título e descrição de tarefas em votação (status `voting` ou `backlog`), disponível apenas se a sala estiver aberta.
- Correção de layout responsivo do filtro de status do backlog na UI da sala de poker.

**Fora do escopo:**
- Sincronização do Backlog Global com ferramentas externas (Jira, Trello, etc.) de maneira automatizada.
- Reabertura de salas finalizadas (a finalização é irreversível).

## Acceptance Criteria

- [ ] AC1: Dado um usuário comum autenticado, quando acessa `/poker/backlog`, então visualizo a lista de tarefas do Backlog Global, mas não vejo botões para criar, editar ou excluir tarefas.
- [ ] AC2: Dado um administrador autenticado (`locals.user.isAdmin === true`), quando acessa `/poker/backlog`, então pode criar novas tarefas globais e editar ou excluir tarefas que tenham `room` nulo.
- [ ] AC3: Dado um administrador autenticado, quando tenta editar ou excluir uma tarefa global que já possui `room` preenchido, então o sistema rejeita a operação com erro.
- [ ] AC4: Dado o responsável de uma sala de poker aberta, quando cria a sala ou gerencia uma sala ativa, então consegue selecionar tarefas do Backlog Global com `room` nulo para vincular à sala.
- [ ] AC5: Dado o responsável de uma sala de poker aberta, quando vincula tarefas globais à sala, então essas tarefas passam a ter o campo `room` atualizado com o ID da sala e aparecem em tempo real no backlog local da sala de poker.
- [ ] AC6: Dado o responsável de uma sala de poker aberta, quando executa a ação de remover a tarefa em votação, então o status da tarefa volta a ser `backlog`, ela deixa de ser a `current_task` da sala, todos os registros em `poker_votes` para aquela tarefa são excluídos e o status `has_voted` de todos os participantes da sala é definido como `false`.
- [ ] AC7: Dado o responsável de uma sala de poker aberta, quando edita o título ou descrição de uma tarefa que está com status `voting` ou `backlog`, então a alteração é sanitizada no servidor e exibida em tempo real para todos os participantes online.
- [ ] AC8: Dado o responsável de uma sala de poker aberta, quando clica em "Finalizar Sala", então a sala muda seu status para `finalized`, limpando a `current_task` (se houver votação ativa) e bloqueando o deck de cartas e botões de controle para todos os participantes.
- [ ] AC9: Dado a finalização da sala, quando o responsável tenta exportar para o Kanban, então ele pode selecionar um subconjunto das tarefas estimadas ou exportar todas. As tarefas exportadas recebem o status `exported` e o link do card criado no Kanban.
- [ ] AC10: Dado que a sala está no status `open`, quando o responsável tenta exportar tarefas para o Kanban, então a ação é bloqueada com erro informando que a sala precisa ser finalizada primeiro.
- [ ] AC11: Dado que os botões de filtro de status do backlog da sala de poker são renderizados em telas menores, então os botões quebram linha adequadamente sem cortar o texto ou encavalar com o título do backlog.
- [ ] `pnpm test` e `pnpm check` sem erros.
- [ ] Documentação em `docs/features/2026-07-12-poker-backlog-global.md`.

## Technical Notes (Ports & Adapters — runes)

| Camada | Ação |
|--------|------|
| PocketBase | Migrations adicionando `status` em `poker_rooms` e `is_global_backlog` em `poker_tasks`. Tornar `room` em `poker_tasks` opcional. Atualizar API Rules de visualização de `poker_tasks` |
| Domínio | Estender `apps/runes/src/lib/domain/planningPokerAccess.ts` com as novas regras de autorização de backlog global e ciclo de vida |
| Domínio reativo | Atualizar `PlanningPokerRoom.svelte.ts` para desabilitar ações de votação se sala estiver `finalized` |
| Server | Atualizar `apps/runes/src/lib/server/pokerRecord.ts` com os novos campos e tipos |
| Validação | Criar esquemas `editTaskSchema`, `linkGlobalTasksSchema` e `createGlobalTaskSchema` em `pokerSchemas.ts` |
| API | Criar rota `/poker/backlog` (load + actions de CRUD global). Adicionar actions `linkGlobalTasks`, `editTask`, `removeTaskFromVoting`, `finalize` e atualizar `exportToKanban` em `/poker/[roomId]` |
| UI | Desenhar tela de listagem `/poker/backlog`. Ajustar `TaskList.svelte` para layout responsivo nos botões de filtro e adicionar controle de edição/remoção de tarefas. Ajustar `PokerRoom.svelte` para tratar o estado de sala finalizada e abrir modal de tarefas globais |

## Links

- Spec: `docs/specs/2026-07-12-poker-backlog-global.md`
- Feature doc: `docs/features/2026-07-12-poker-backlog-global.md`
- PR (após implementação): `docs/workflow/poker-backlog-global.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks (opcional)

- [ ] Backend: Migrations para novos campos no PocketBase + ajuste nas API Rules
- [ ] Domínio: Novas regras em `planningPokerAccess.ts` + testes unitários
- [ ] Rota `/poker/backlog`: Implementar load e actions (CRUD do admin) + UI da listagem
- [ ] Rota `/poker/[roomId]`: Implementar ciclo de vida, ações de remoção/edição de tarefas da sala + UI responsiva dos filtros e modal global
- [ ] E2E: Implementar e2e cobrindo fluxos de backlog global, remoção de task da votação e exportação somente quando finalizada
- [ ] Documentação + PR
