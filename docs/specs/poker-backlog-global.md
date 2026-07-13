# Backlog Global e Gerenciamento do Ciclo de Vida da Sala (Planning Poker)

## Contexto

Atualmente, as salas de Planning Poker operam de forma isolada no sistema. Todas as tarefas para estimativa precisam ser criadas manualmente dentro de cada sala, não existindo um local centralizado para gerenciar um backlog global de tarefas que possam ser importadas para múltiplas sessões. Além disso, as salas não possuem controle de estado formalizado (como "Aberta" vs "Finalizada"), permitindo a exportação para o Kanban a qualquer momento, e a edição de tarefas em votação ou a remoção delas de votação sem o devido reset de votos não estão totalmente especificadas ou implementadas. A UI de filtros de tarefas também apresenta problemas de quebra de layout em telas menores.

## Objetivo

Implementar um Backlog Global de tarefas do Planning Poker gerenciável por administradores, permitindo que responsáveis por salas vinculem essas tarefas globais às suas salas (tanto na criação quanto durante a sessão). Introduzir o ciclo de vida da sala (`status` como "Aberta" ou "Finalizada"), com regras estritas para exportação e remoção/edição de tarefas, e ajustar a UI de filtros para layouts responsivos.

## Escopo

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
- Integração automática com ferramentas externas (como Jira) para sincronizar o Backlog Global (apenas cadastro manual interno via PocketBase nesta versão).
- Reabertura de salas finalizadas (uma vez finalizada, a sala permanece finalizada).
- Histórico detalhado de quais usuários votaram o quê em tarefas que foram removidas da votação (os votos individuais da tarefa removida são excluídos permanentemente).

## Requisitos funcionais

- **RF1: Tela de Backlog Global**: O sistema deve disponibilizar uma tela em `/poker/backlog` listando as tarefas do backlog global ainda não vinculadas a nenhuma sala (`is_global_backlog = true && room` nulo — ver nota de segurança do RF3/API Rules sobre por que tarefas já vinculadas não aparecem mais aqui).
- **RF2: Controle de Escrita no Backlog Global**: Apenas usuários com privilégios de administrador do sistema (`locals.user.isAdmin === true`) podem criar, editar ou excluir tarefas no Backlog Global. Usuários comuns podem apenas listar e visualizar.
- **RF3: Restrição de Alteração de Tarefa Vinculada**: Uma tarefa no Backlog Global só pode ser editada ou excluída se não estiver vinculada a nenhuma sala de poker (ou seja, `room` é nulo).
- **RF4: Vínculo de Tarefa Global**: O responsável por uma sala pode vincular tarefas disponíveis do Backlog Global (`is_global_backlog = true` e `room` nulo) à sua sala. Isso pode ser feito:
  - No momento da criação da sala, através do modal "Nova Sala" já existente em `/poker` (`+page.svelte`, action `?/createRoom` em `+page.server.ts`) — **não existe rota `/poker/new`**; o modal precisa ganhar um passo de seleção de tarefas globais e a action `createRoom` precisa aceitar um novo campo opcional `taskIds: string[]`, vinculando-as à sala logo após criá-la.
  - Com a sala aberta, através de um modal "Vincular do Backlog Global".
- **RF5: Independência de Tarefas Locais**: O vínculo de tarefas globais não impede a criação de tarefas locais diretamente na sala (que são criadas com `is_global_backlog = false`).
- **RF6: Ciclo de Vida da Sala**: A sala de poker deve conter um campo `status` (`open` ou `finalized`). Toda sala é criada no estado `open`.
- **RF7: Finalização de Sala**: Apenas o responsável pela sala (participante com papel `admin`) pode finalizá-la, alterando o status para `finalized`.
- **RF8: Restrições de Sala Finalizada**: Quando a sala estiver no status `finalized`, o sistema deve bloquear, **no servidor** (não só ocultando os controles na UI, conforme convenção do projeto em `pocketbase-api-rules.mdc`):
  - Início de novas votações ou seleção de tarefas (`setTask` — action já existente, precisa ganhar checagem `room.status === 'open'`, hoje ausente).
  - Lançamento de votos (`vote` — action já existente; hoje só falha incidentalmente porque `finalize` zera `current_task` e `vote` rejeita sem task selecionada; precisa de checagem explícita `room.status === 'open'` para não depender desse efeito colateral).
  - Criação de novas tarefas locais (`createTask` — action já existente, precisa ganhar checagem `room.status === 'open'`, hoje ausente) ou vinculação de tarefas globais (`linkGlobalTasks`, nova).
  - Edição de tarefas da sala (`editTask`, nova).
  - Remoção de tarefas de votação (`removeTaskFromVoting`, nova).
- **RF8.1: Exceção — Fechamento de Estimativa Pós-Finalização**: A action já existente `setFinalPoints` **não** é bloqueada pelo RF8 e continua disponível mesmo com a sala `finalized`. Isso é intencional: como `finalize` limpa `current_task`/`revealed` mas não altera o `status` de uma task que estava em `voting` no momento da finalização, o responsável precisa continuar podendo atribuir os pontos finais a essa task (movendo-a para `estimated`) para que ela ainda possa ser exportada ao Kanban. É a única exceção ao bloqueio geral do RF8.
- **RF9: Exportação Condicional**: A exportação de tarefas estimadas (`status = 'estimated'`) para o Kanban só é permitida se a sala estiver no status `finalized`. O responsável pode exportar todas as tarefas estimadas ou selecionar individualmente quais deseja exportar.
- **RF10: Remoção de Tarefa de Votação**: O responsável pela sala pode remover uma tarefa da votação (retornando-a para `status = 'backlog'`), desde que a sala esteja `open`. Essa ação deve:
  - Limpar o campo `current_task` da sala (se a tarefa removida for a atual).
  - Excluir permanentemente todos os votos (`poker_votes`) associados a essa tarefa.
  - Resetar o status `has_voted` para `false` de todos os participantes ativos da sala.
- **RF11: Edição de Tarefas em Votação/Backlog**: O responsável pela sala pode editar o título e a descrição de qualquer tarefa no status `voting` ou `backlog`, desde que a sala esteja no status `open`.
- **RF12: Layout Responsivo dos Filtros**: O filtro de status das tarefas no backlog da sala deve usar um layout flexível que quebre linhas de forma responsiva em telas menores, evitando sobreposição e cortes visuais.

## Requisitos não funcionais

- **Segurança**:
  - **Prevenção de XSS**: Todas as descrições de tarefas editadas/criadas tanto no Backlog Global quanto nas salas de poker devem ser sanitizadas no servidor com a biblioteca `sanitize-html` antes de serem salvas no PocketBase.
  - **IDOR / Escalação de Privilégios**: As ações de criação, edição e exclusão de tarefas globais devem validar estritamente no servidor (`+page.server.ts`) se `locals.user.isAdmin === true`. As ações de gerenciamento de sala (finalizar, vincular tarefas, remover da votação, editar tarefas) devem validar no servidor se o usuário logado possui papel `admin` na respectiva sala de poker.
  - **API Rules**:
    - As regras de criação, atualização e exclusão (`createRule`, `updateRule`, `deleteRule`) de `poker_tasks` e `poker_rooms` devem continuar configuradas como `null` no PocketBase. Isso força que todas as escritas sejam feitas exclusivamente pelo backend via SvelteKit Form Actions, onde as regras de autorização do domínio são validadas de forma robusta e segura.
    - A regra de listagem/visualização (`listRule` e `viewRule`) em `poker_tasks` deve ser afrouxada para permitir que qualquer usuário autenticado leia tarefas globais **ainda não vinculadas**: `@request.auth.id != '' && ((is_global_backlog = true && room = '') || (room != '' && room.poker_participants_via_room.user.email = @request.auth.email && room.poker_participants_via_room.has_left = false))`. **Atenção**: a condição `is_global_backlog = true` sozinha (sem `&& room = ''`) vazaria título/descrição de uma tarefa já vinculada a uma sala privada para qualquer usuário autenticado, mesmo sem ele ser participante daquela sala — por isso a leitura via backlog global só vale enquanto `room` estiver vazio; uma vez vinculada, a tarefa só é visível pela regra de participação da sala.
- **Realtime**:
  - A mudança de status da sala para `finalized` deve ser detectada instantaneamente no cliente através da subscription de realtime no record da sala, travando a interface e desabilitando as interações de votação imediatamente.
  - As atualizações de vínculo e remoção de tarefas devem propagar-se via subscription de realtime de `poker_tasks` e atualizar a UI dinamicamente.

## Critérios de aceite

- [ ] **AC1**: Dado um usuário comum autenticado, quando acessa `/poker/backlog`, então visualizo a lista de tarefas do Backlog Global, mas não vejo botões para criar, editar ou excluir tarefas.
- [ ] **AC2**: Dado um administrador autenticado (`locals.user.isAdmin === true`), quando acessa `/poker/backlog`, então pode criar novas tarefas globais e editar ou excluir tarefas que tenham `room` nulo.
- [ ] **AC3**: Dado um administrador autenticado, quando tenta editar ou excluir uma tarefa global que já possui `room` preenchido, então o sistema rejeita a operação com erro.
- [ ] **AC4**: Dado o responsável de uma sala de poker aberta, quando cria a sala ou gerencia uma sala ativa, então consegue selecionar tarefas do Backlog Global com `room` nulo para vincular à sala.
- [ ] **AC5**: Dado o responsável de uma sala de poker aberta, quando vincula tarefas globais à sala, então essas tarefas passam a ter o campo `room` atualizado com o ID da sala e aparecem em tempo real no backlog local da sala de poker.
- [ ] **AC6**: Dado o responsável de uma sala de poker aberta, quando executa a ação de remover a tarefa em votação, então o status da tarefa volta a ser `backlog`, ela deixa de ser a `current_task` da sala, todos os registros em `poker_votes` para aquela tarefa são excluídos e o status `has_voted` de todos os participantes da sala é definido como `false`.
- [ ] **AC7**: Dado o responsável de uma sala de poker aberta, quando edita o título ou descrição de uma tarefa que está com status `voting` ou `backlog`, então a alteração é sanitizada no servidor e exibida em tempo real para todos os participantes online.
- [ ] **AC8**: Dado o responsável de uma sala de poker aberta, quando clica em "Finalizar Sala", então a sala muda seu status para `finalized`, limpando a `current_task` (se houver votação ativa) e bloqueando o deck de cartas e botões de controle para todos os participantes.
- [ ] **AC9**: Dado a finalização da sala, quando o responsável tenta exportar para o Kanban, então ele pode selecionar um subconjunto das tarefas estimadas ou exportar todas. As tarefas exportadas recebem o status `exported` e o link do card criado no Kanban.
- [ ] **AC10**: Dado que a sala está no status `open`, quando o responsável tenta exportar tarefas para o Kanban, então a ação é bloqueada com erro informando que a sala precisa ser finalizada primeiro.
- [ ] **AC11**: Dado que os botões de filtro de status do backlog da sala de poker são renderizados in telas menores, então os botões quebram linha adequadamente sem cortar o texto ou encavalar com o título do backlog.
- [ ] Testes unitários puros (`planningPokerAccess.test.ts` e novos testes de autorização de backlog) validando todas as novas permissões de escrita, vínculo e ciclo de vida, bem como testes E2E Playwright cobrindo os novos fluxos.

## Design (Ports & Adapters)

O padrão de arquitetura do projeto (`apps/runes`) realiza mutações via *form actions* e centraliza a lógica de autorização em funções puras na camada de domínio.

| Camada | Mudança prevista |
|--------|-------------------|
| **PocketBase** | **Nova migration** (ex.: `0017_poker_backlog_global.js` — não editar `0016_create_poker_collections.js`, já aplicada):<br>**1. `poker_rooms`**: Adicionar o campo `status` (select `['open', 'finalized']`, default `'open'`, required).<br>**2. `poker_tasks`**: Alterar a relação `room` para ser opcional (`required: false`); adicionar o campo `is_global_backlog` (bool, default `false`).<br>**3. API Rules**: Atualizar `listRule` e `viewRule` em `poker_tasks` para contemplar tarefas globais **não vinculadas**: `@request.auth.id != '' && ((is_global_backlog = true && room = '') || (room != '' && room.poker_participants_via_room.user.email = @request.auth.email && room.poker_participants_via_room.has_left = false))` (ver nota de segurança acima sobre vazamento se `&& room = ''` for omitido). Regras de escrita continuam como `null`. |
| **Domínio (função pura)** | Atualizar ou estender `apps/runes/src/lib/domain/planningPokerAccess.ts` com as novas regras de autorização e estado:<br>- `canEditGlobalTask(user, task)`: apenas se `user.isAdmin === true` e `task.room` for nulo.<br>- `canDeleteGlobalTask(user, task)`: apenas se `user.isAdmin === true` e `task.room` for nulo.<br>- `canLinkGlobalTasks(user, participant, room)`: apenas se o participante for admin/responsável na sala e `room.status === 'open'`.<br>- `canFinalizeRoom(participant, room)`: apenas se participante for admin e `room.status === 'open'`.<br>- `canExportFromRoom(participant, room)`: apenas se participante for admin e `room.status === 'finalized'`.<br>- `canRemoveFromVoting(participant, room, task)`: apenas se participante for admin, `room.status === 'open'` e `task.status === 'voting'`.<br>- `canEditTaskInRoom(participant, room, task)`: apenas se participante for admin, `room.status === 'open'` e `task.status` for `backlog` ou `voting`.<br>- **`canCreateTaskInRoom(room)`** (nova, usada por `createTask`): apenas se `room.status === 'open'`.<br>- **`canVote(role, revealed, roomStatus)`** (assinatura estendida — hoje é `canVote(role, revealed)`): adicionar o parâmetro `roomStatus` e retornar `false` se `roomStatus !== 'open'`, para que `vote` não dependa apenas do efeito colateral de `current_task` ser limpo por `finalize`.<br>- **`canSetTask(participant, room)`** (nova, usada por `setTask`): apenas se `canManageRoom(participant.role)` e `room.status === 'open'`. |
| **Domínio reativo (client)** | Atualizar `apps/runes/src/lib/domain/PlanningPokerRoom.svelte.ts` para reagir ao `status` da sala (`finalized`), desabilitando interações de votação no client e adaptando a UI. |
| **Server (types)** | Atualizar `apps/runes/src/lib/server/pokerRecord.ts` para refletir `status` em `PokerRoomRecord`, e `is_global_backlog` (bool) e `room` (string opcional) in `PokerTaskRecord`. |
| **Validação** | Em `apps/runes/src/lib/validation/pokerSchemas.ts`:<br>- `editTaskSchema` (validação de `title` e `description` para edição).<br>- `linkGlobalTasksSchema` (array de IDs de tarefas globais para vinculação).<br>- `createGlobalTaskSchema` (Zod schema para tarefa global, `title` obrigatório e `description` opcional). |
| **API** | **1. Rota `/poker/backlog`**:<br>- `load`: Carrega tarefas globais ainda não vinculadas (`is_global_backlog = true && room = ''`, refletindo a `listRule` acima).<br>- Form Actions: `createGlobalTask` (admin), `editGlobalTask` (admin, se não vinculada), `deleteGlobalTask` (admin, se não vinculada).<br>**2. Rota `/poker` (`+page.server.ts`, já existente)**:<br>- Atualizar a action existente `createRoom` para aceitar `taskIds?: string[]` e, após criar a sala e o participante `admin`, vincular essas tarefas globais (`room = novaSalaId`) — cobre o passo de vínculo "no momento da criação" do RF4.<br>**3. Rota `/poker/[roomId]`**:<br>- Adicionar Form Actions:<br>  - `linkGlobalTasks` (recebe array de IDs de tarefas globais e vincula à sala).<br>  - `editTask` (responsável edita título e descrição da task na sala aberta).<br>  - `removeTaskFromVoting` (responsável cancela votação da task atual, zera votos e a retorna para backlog).<br>  - `finalize` (responsável altera status da sala para `finalized` **e limpa `current_task`/`revealed`** se houver votação ativa).<br>- Atualizar Form Action `exportToKanban` para exigir que a sala esteja `finalized`.<br>- **Atualizar as actions já existentes `vote`, `setTask` e `createTask` para rejeitar com `fail(403)` quando `room.status !== 'open'`** (usando `canVote`/`canSetTask`/`canCreateTaskInRoom` acima) — hoje nenhuma delas verifica o status da sala.<br>- **Não alterar** a action existente `setFinalPoints` — permanece disponível mesmo com `room.status === 'finalized'` (ver RF8.1). |
| **UI** | **1. Rota `/poker/backlog`**: Nova página para listagem e gerenciamento de backlog global (controles de CRUD visíveis apenas para admin).<br>**2. Componente `TaskList.svelte`**: Correção de Tailwind CSS no container de filtros (trocar `join` por `flex flex-wrap gap-1.5` com botões individuais estilizados), adicionar botões de "Remover da Votação" e "Editar Task" para o responsável.<br>**3. Componente `PokerRoom.svelte`**: Ajuste visual para sala finalizada, bloqueando deck e controles de rodada, mostrando layout de exportação. Adicionar modal de seleção de tarefas globais. |

## Contrato de API (Form Actions)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/poker/backlog` | — | Lista de tarefas do backlog global, com informações de vínculo |
| POST (form action) | `/poker/backlog` (`createGlobalTask`) | `title: string`, `description?: string` | Redirect ou `fail(400, {errors})` / `fail(403)` se não admin |
| POST (form action) | `/poker/backlog` (`editGlobalTask`) | `taskId: string`, `title: string`, `description?: string` | `fail(400)` se inválido, `fail(403)` se não admin ou se já vinculada |
| POST (form action) | `/poker/backlog` (`deleteGlobalTask`) | `taskId: string` | `fail(403)` se não admin ou se já vinculada |
| POST (form action) | `/poker/[roomId]` (`linkGlobalTasks`) | `taskIds: string[]` (IDs das tarefas globais) | `fail(403)` se não responsável ou sala finalizada |
| POST (form action) | `/poker/[roomId]` (`editTask`) | `taskId: string`, `title: string`, `description?: string` | `fail(400)` se inválido, `fail(403)` se não responsável ou sala finalizada |
| POST (form action) | `/poker/[roomId]` (`removeTaskFromVoting`) | `taskId: string` | `fail(403)` se não responsável ou sala finalizada; limpa votos e retorna a task para status `backlog` |
| POST (form action) | `/poker/[roomId]` (`finalize`) | — | `fail(403)` se não responsável; altera status da sala para `finalized` e limpa `current_task`/`revealed` da sala se houver votação ativa |
| POST (form action) | `/poker/[roomId]` (`exportToKanban`) | `taskIds: string[]` | Cria cards e altera status para `exported`. `fail(403)` se não responsável ou sala não finalizada |
| POST (form action) | `/poker/[roomId]` (`vote`) — **existente, atualizada** | `value: string` | **Novo:** `fail(403)` se `room.status !== 'open'` (além das validações já existentes de role/task) |
| POST (form action) | `/poker/[roomId]` (`setTask`) — **existente, atualizada** | `taskId: string` | **Novo:** `fail(403)` se `room.status !== 'open'` (além da checagem já existente de `canManageRoom`) |
| POST (form action) | `/poker/[roomId]` (`createTask`) — **existente, atualizada** | `title: string`, `description?: string` | **Novo:** `fail(403)` se `room.status !== 'open'` (além das validações já existentes) |
| POST (form action) | `/poker` (`createRoom`) — **existente, atualizada** | `name: string`, `taskIds?: string[]` (novo, IDs de tarefas globais para vincular já na criação) | Redirect para `/poker/{roomId}` (sem alteração no contrato de erro existente) |
| POST (form action) | `/poker/[roomId]` (`setFinalPoints`) — **existente, sem alteração** | `taskId: string`, `points: number \| null` | Sem alteração — permanece disponível mesmo com `room.status === 'finalized'` (RF8.1) |

## Alternativas consideradas

- **Duplicar a tarefa global ao vinculá-la à sala**: Em vez de atualizar o campo `room` da tarefa global (fazendo-a pertencer à sala), poderíamos criar uma cópia da tarefa no momento do vínculo. Isso permitiria que uma tarefa global fosse usada em múltiplas salas simultaneamente e pudesse ser editada livremente no backlog global mesmo após vinculada. No entanto, o requisito explicita que a tarefa não pode ser editada se estiver vinculada, o que indica que o comportamento esperado é de referência/movimentação direta. Além disso, a abordagem de referência direta evita duplicação de dados e mantém a rastreabilidade exata de qual tarefa global foi estimada em qual sala.

## Questões em aberto

- **Reabertura de Salas**: Há necessidade futura de permitir que um responsável reabra uma sala finalizada? Na especificação atual, a finalização é irreversível para garantir a consistência das exportações de cards para o Kanban.

## Links

- Jira (após aprovação da spec): `docs/workflow/poker-backlog-global.jira.md`
- Feature doc (pós-implementação): `docs/features/poker-backlog-global.md`
- PR: `docs/workflow/poker-backlog-global.pr.md`
- Depende de: [`planning-poker`](./planning-poker.md), [`kanban`](./kanban.md)
- Specs relacionadas: [`pocketbase-user-crud`](./pocketbase-user-crud.md) (regras de privilégio admin)
