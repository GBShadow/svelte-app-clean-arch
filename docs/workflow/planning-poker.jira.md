# Feature: Planning Poker em tempo real

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Epic |
| Priority | High |
| Labels | sveltekit, ports-adapters, runes, realtime, tiptap, planning-poker |
| Story Points | 13 |
| Jira Key | [JIRA-KEY] |
| Epic | Planning Poker & Kanban |

## Description

### Contexto

As equipes precisam de uma ferramenta colaborativa em tempo real para estimar o esforço das tarefas antes do desenvolvimento. Hoje isso é feito em apps externos, sem integração com o Kanban.

### Objetivo

Salas de Planning Poker em tempo real (PocketBase realtime): participantes criam tasks que ficam num **backlog da sala**, votam nelas com cartas Fibonacci (votos ocultos até a revelação), o Responsável define a pontuação final e exporta as tasks estimadas para o Kanban como cards em "Aguardando". A task exportada fica marcada com `status = 'exported'` (selo "No Kanban") e guarda a relação com o card criado.

### Escopo

**(Escopo detalhado na spec: `docs/specs/planning-poker.md`)**

## Acceptance Criteria

- [ ] AC1: Crio uma task com Tiptap e a seleciono para votação; todos com a sala aberta veem em tempo real.
- [ ] AC2: Quando todos os votantes online votaram, qualquer votante revela; os votos aparecem com média e distribuição.
- [ ] AC3: Como Responsável, revelo a qualquer momento, mesmo sem todos terem votado.
- [ ] AC4: Como Responsável, ao selecionar uma nova task, os votos da rodada anterior são limpos e `revealed` volta a `false`.
- [ ] AC5: Como Responsável, finalizo a sala e exporto as tasks escolhidas para o Kanban (coluna `type = 'backlog'`), com título, descrição e pontos corretos.
- [ ] AC6: Como Espectador, minha tentativa de votar é rejeitada.
- [ ] AC7: Como Responsável, mudo o papel de um participante e a mudança aparece em tempo real para todos.
- [ ] AC8: Enquanto não revelado, vejo que "fulano votou" (status via `has_voted`), mas não o valor do voto.
- [ ] AC9 (segurança): Um autenticado que abre a sala entra como **Votante**; forjar `role: 'admin'` em chamada direta à API do PocketBase é rejeitado.
- [ ] AC10: Ao fechar a aba, meu `is_online` vira `false` e os demais me veem offline em tempo real.
- [ ] AC11 (segurança): Um Votante que tenta alterar `role`, `final_points` ou `has_voted` — pela UI ou por chamada direta à API — é rejeitado.
- [ ] AC12: Se os votos são revelados com a sala aberta, vejo os votos de todos (refetch), não uma lista vazia.
- [ ] AC13: O HTML das descrições de task é sanitizado no servidor (sem XSS armazenado).
- [ ] AC14: Sala recém-criada, sem nenhuma votação, já exibe a **área de backlog** (vazia, com ação de criar a primeira task) — a área não depende de haver votação.
- [ ] AC14a: Task criada (inclusive durante uma rodada) entra no backlog da sala (`status = 'backlog'`) sem interromper a votação em andamento; só tasks do backlog podem ser escolhidas para uma nova rodada.
- [ ] AC14b: O backlog lista **todas** as tasks da sala e oferece **filtro por status** (Todas / Backlog / Em votação / Estimadas / No Kanban), aplicado no client, sem recarregar a página.
- [ ] AC15: Task que recebe `final_points` sai do backlog (`status = 'estimated'`) e passa a aparecer na lista de exportação.
- [ ] AC16: Task exportada vira `status = 'exported'`, exibe o selo **"No Kanban"** com link para o card e some da lista de exportação. Exportar a mesma task de novo (mesmo forçando a action) **não** cria card duplicado.
- [ ] AC17: Tasks sem `final_points` permanecem no backlog da sala ao finalizar e não são exportadas.
- [ ] AC18 (segurança, sigilo dos votos): Um participante que tenta `PATCH revealed = true` em `poker_rooms` **por chamada direta à API** é rejeitado e não consegue ler votos alheios antes da revelação legítima.
- [ ] AC19 (segurança): Um Espectador que tenta criar um voto por chamada direta à API é rejeitado (escrita de voto é server-only, atrás de `canVote`).
- [ ] AC20: Sair da sala (ou ser removido) marca `has_left = true` — o registro do participante **não** é apagado (RF4) — e reentrar pelo link reaproveita o mesmo record, sem duplicar participante.
- [ ] Testes unitários puros (`planningPokerAccess.test.ts`) e E2E Playwright cobrindo os cenários acima.
- [ ] `pnpm test` e `pnpm check` sem erros.
- [ ] Documentação em `docs/features/planning-poker.md` + CHANGELOG.

## Technical Notes (padrão real do projeto — form actions + `locals.pb`, ver spec)

| Camada | Ação |
|--------|------|
| PocketBase | Migrations + API Rules de `poker_rooms`, `poker_tasks` (`status` [`backlog`, `voting`, `estimated`, `exported`] + `exported_card` → `kanban_cards`), `poker_participants` (`is_online`, `has_voted`, `has_left`) e `poker_votes`. Back-relation no formato `poker_participants_via_room`. `viewRule` de `poker_votes` = `user = @request.auth.id \|\| room.revealed = true` (anti-leak de realtime). **Escrita direta do cliente só em 3 pontos**: criar sala, auto-join como `voter` (`createRule` força `user = self` e `role = 'voter'`) e o próprio `is_online`. Todo o resto é server-only (`updateRule`/`deleteRule` = `null`) via `getAdminClient()` — inclusive `revealed` (senão qualquer participante revelaria os votos por `PATCH` direto), os votos (senão um Espectador votaria pela API) e `has_left` (sair marca o campo, nunca apaga o record — RF4) |
| Domínio | `planningPokerAccess.ts` (`canVote`, `canReveal`, `canChangeRole`, `canSetFinalPoints`, `allVotersVoted`, `averageOfNumericVotes` — ignora `?`/`☕`) e `PlanningPokerRoom.svelte.ts` (estado realtime; **refetch de `poker_votes` quando `revealed` vira `true`**) |
| Server | `pokerRecord.ts` (types); `pocketbaseAdmin.ts` (já existente) para as escritas privilegiadas |
| API | `apps/runes/src/routes/poker/` — `/poker` (lista), `/poker/new` (cria sala + participante admin via admin client), `/poker/[roomId]` (auto-join, `is_online`, actions `vote`, `reveal`, `resetVotes`, `setTask`, `createTask`, `setFinalPoints`, `changeRole`, `removeParticipant`, `goOffline`, `finalize`, `exportToKanban`) |
| UI | `apps/runes/src/lib/components/planning-poker/` (PokerRoom, CardDeck, ParticipantsList, VoteResults, TaskEditor, TaskList) |
| Deps | `tiptap` + sanitização de HTML no server (compartilhado com o Kanban) |
| Testes | Unitários (funções puras) + E2E Playwright |

## Subtasks (opcional)

- [ ] Migrations e API Rules das 4 coleções (com foco no anti-leak de votos e no auto-join restrito)
- [ ] `planningPokerAccess.ts` (permissões + média/distribuição) + testes unitários
- [ ] Salas: listagem, criação, auto-join e presença (`is_online`)
- [ ] Tasks com Tiptap + sanitização; **área de backlog da sala** (existe desde a criação, lista todas as tasks, filtro por status no client) e ciclo de vida do `status` (`nextTaskStatus`); rodada por task (limpeza de votos e `has_voted`)
- [ ] Votação, status via `has_voted`, revelação e refetch dos votos
- [ ] Papéis, saída/remoção de participantes (`has_left`, sem apagar record) e `final_points`
- [ ] Finalização + exportação para o Kanban (coluna `backlog`), marcação `exported` + `exported_card` e selo "No Kanban" (sem duplicação)
- [ ] E2E Playwright + documentação (feature doc, CHANGELOG) + PR

## Links

- Spec: `docs/specs/planning-poker.md`
- Feature doc: `docs/features/planning-poker.md`
- PR (após implementação): `docs/workflow/planning-poker.pr.md`
- Depende de: `docs/specs/kanban.md` (a exportação escreve em `kanban_cards`; as migrations do Kanban precisam existir antes)
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch
