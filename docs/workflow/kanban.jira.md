# Feature: Kanban

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Epic |
| Priority | High |
| Labels | sveltekit, ports-adapters, runes, kanban, realtime, tiptap |
| Story Points | 13 |
| Jira Key | [JIRA-KEY] |
| Epic | Planning Poker & Kanban |

## Description

### Contexto

A aplicação possui um módulo de Planning Poker recém-especificado para estimativa de tarefas, e há a necessidade de um quadro Kanban completo para acompanhar o fluxo das tarefas estimadas e outras atividades. O Kanban é essencial para visualizar o progresso do time, gerenciar atividades em diferentes estados e facilitar a organização através de filtros e edição rica.

### Objetivo

Criar um quadro Kanban único e global, integrado com o Planning Poker: drag and drop de cards entre colunas (e reordenação dentro delas), colunas fixas ("Aguardando"/"Feito") mais colunas personalizadas gerenciadas por administradores, edição rica com Tiptap, múltiplos responsáveis, comentários, histórico imutável, filtros e atualização em tempo real.

### Escopo

**(Escopo detalhado na spec: `docs/specs/kanban.md`)**

## Acceptance Criteria

- [ ] AC1: Como administrador, crio colunas personalizadas e reordeno as intermediárias; "Aguardando" é sempre a primeira e "Feito" a última. Colunas fixas rejeitam renomeio/deleção também no backend.
- [ ] AC2: Movo um card entre colunas por drag and drop e o reordeno dentro da mesma coluna.
- [ ] AC3: Ao criar/editar um card, o editor Rich Text (Tiptap) é apresentado e posso definir múltiplos responsáveis, tags e data de vencimento. Inserir script no editor não resulta em XSS ao visualizar.
- [ ] AC4: A pontuação de um card exportado do Planning Poker fica visível no card e pode ser alterada.
- [ ] AC5: Filtro os cards por pontuação, tag, responsável ou data de vencimento.
- [ ] AC6: Visualizo e adiciono comentários de texto simples no card; enviar HTML não resulta em injeção.
- [ ] AC7: Visualizo o histórico do card (quem alterou qual campo); o log não pode ser alterado nem apagado (nem por admin).
- [ ] AC8: Ao apagar uma coluna personalizada, seus cards vão automaticamente para "Aguardando" — nenhum card fica órfão nem é apagado junto.
- [ ] AC9: Com dois usuários no board, uma alteração de um aparece em tempo real para o outro.
- [ ] AC10 (segurança): Chamadas **diretas à API do PocketBase** são rejeitadas ao tentar criar/alterar/apagar card, criar/renomear/mover/apagar coluna (inclusive um admin tentando arrastar "Aguardando" para o meio) ou alterar registro de histórico. A única escrita direta permitida ao cliente é a do próprio comentário.
- [ ] AC11 (acessibilidade): Mover e reordenar cards funciona apenas pelo teclado, com anúncio a leitores de tela.
- [ ] AC12: Toda alteração de card feita pela aplicação gera registro de histórico — não existe caminho de escrita que altere um card sem rastro.
- [ ] Testes unitários puros (`kanbanAccess.test.ts`, incluindo `reorderPositions`) e E2E Playwright cobrindo os cenários acima.
- [ ] `pnpm test` e `pnpm check` sem erros.
- [ ] Documentação em `docs/features/kanban.md` + CHANGELOG.

## Technical Notes (padrão real do projeto — form actions + `locals.pb`, ver spec)

| Camada | Ação |
|--------|------|
| PocketBase | Migrations + API Rules: `kanban_columns` (`type` backlog/done/custom + seed das 3 fixas; **escrita 100% server-side** — `create`/`update`/`delete` = `null` —, para preservar as invariantes de ordem e a realocação de cards do RF12), `kanban_cards` (`position`, `points`, `tags` json, `due_date`; **escrita 100% server-side**, para o histórico ser confiável), `kanban_card_comments` (única escrita direta do cliente, com campos travados), `kanban_card_history` (imutável: create só via admin client, update/delete `null`) |
| Domínio | `kanbanAccess.ts` (regras puras + `reorderPositions`) e `KanbanBoard.svelte.ts` (estado realtime, dedup por id, filtros com `$derived`) |
| Server | `kanbanRecord.ts` (types) e `kanbanHistory.ts` (`recordFieldChanges` via `getAdminClient()`) |
| API | `apps/runes/src/routes/kanban/+page.server.ts` com Form Actions (`createColumn`, `renameColumn`, `moveColumn`, `deleteColumn`, `createCard`, `updateCard`, `moveCard`, `deleteCard`, `addComment`, `deleteComment`) |
| UI | `apps/runes/src/lib/components/kanban/` com Tiptap e `svelte-dnd-action` (DnD acessível por teclado) |
| Deps | Instalar `tiptap` e `svelte-dnd-action`; sanitização de HTML no server |
| Testes | Unitários (funções puras) + E2E Playwright |

## Subtasks (opcional)

- [ ] Migrations e API Rules das 4 coleções (incluindo seed das colunas fixas)
- [ ] `kanbanAccess.ts` + `reorderPositions` + testes unitários
- [ ] Form actions de cards (create/update/move/delete) com histórico via `recordFieldChanges`
- [ ] Form actions de colunas (admin) + exclusão com realocação de cards
- [ ] UI do board com `svelte-dnd-action` (mouse + teclado) e realtime
- [ ] Editor Tiptap + sanitização + comentários e histórico no detalhe do card
- [ ] Filtros no client
- [ ] E2E Playwright + documentação (feature doc, CHANGELOG) + PR

## Links

- Spec: `docs/specs/kanban.md`
- Feature doc: `docs/features/kanban.md`
- PR (após implementação): `docs/workflow/kanban.pr.md`
- Depende de: `docs/specs/pocketbase-auth.md`, `docs/specs/pocketbase-user-crud.md`
- Relacionado: `docs/workflow/planning-poker.jira.md` (exporta tasks para este Kanban)
