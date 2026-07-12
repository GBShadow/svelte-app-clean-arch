# Kanban

## Contexto

A aplicação possui um módulo de Planning Poker recém-especificado para estimativa de tarefas, e há a necessidade de um quadro Kanban completo para acompanhar o fluxo das tarefas estimadas e outras atividades. O Kanban é essencial para visualizar o progresso do time, gerenciar atividades em diferentes estados e facilitar a organização através de filtros e edição rica.

## Objetivo

Criar um quadro Kanban **único e global**, atualizado em tempo real e integrado com o Planning Poker, permitindo arrastar e soltar (drag and drop) cards livremente entre as colunas "Aguardando", "Fazendo" e "Feito" — e reordená-los dentro delas —, com suporte a criação, edição rica (Tiptap), exclusão, atribuição de responsáveis, comentários, histórico imutável e filtros.

## Escopo

**Incluído:**
- Colunas padrão do Kanban: "Aguardando", "Fazendo", "Feito".
- Criação de novas colunas com nomes personalizados (apenas para administradores).
- Ordenação dinâmica de colunas (drag and drop): a coluna "Aguardando" fica sempre travada no início e a "Feito" sempre no final. As novas colunas e a "Fazendo" podem ser movidas entre elas.
- Drag and drop livre de cards entre as colunas e reordenação dentro das colunas para todos os usuários.
- Exibição, no card, da pontuação (Story Points) definida no Planning Poker.
- Criação, edição (com editor Rich Text / Tiptap) e exclusão de cards diretamente na interface.
- Atribuição de múltiplos responsáveis (assignees) aos cards.
- Sessão de comentários interativos (texto simples) dentro de cada card.
- Sessão de histórico imutável registrando as atualizações (quem atualizou e qual campo, sem salvar o diff do conteúdo).
- Filtros para os cards no Kanban: Por Responsável, Tags/Temas, Pontuação (Story Points) e Data de Vencimento.

**Fora do escopo:**
- Iniciar uma sessão de Planning Poker diretamente do Kanban (a pontuação é apenas exibida).
- Restrições/bloqueios de movimentação de cards por usuário.
- Automações de status (ex: mover automaticamente).

## Requisitos funcionais

- RF1: O sistema deve exibir colunas padrão (Aguardando, Fazendo, Feito) e permitir a criação de novas colunas personalizadas. Apenas usuários administradores (role `isAdmin` na coleção `auth`) podem criar, renomear, mover e excluir colunas personalizadas.
- RF2: O sistema deve permitir a reordenação das colunas personalizadas e da "Fazendo" via drag and drop, mantendo "Aguardando" sempre na primeira posição e "Feito" sempre na última. Colunas padrão não podem ser renomeadas ou excluídas.
- RF3: O usuário deve poder criar novos cards no Kanban.
- RF4: O usuário deve poder editar os cards utilizando um editor Rich Text (Tiptap). A descrição deve ser sanitizada no backend.
- RF5: O usuário deve poder excluir os cards que criou; administradores podem excluir qualquer card. Excluir um card apaga junto seus comentários e seu histórico (`cascadeDelete`).
- RF6: O usuário deve poder atribuir ou alterar múltiplos responsáveis por card, além de definir tags (texto livre, múltiplas por card) e data de vencimento — os campos sobre os quais os filtros do RF9 operam.
- RF7: O sistema deve permitir a movimentação livre dos cards entre as colunas via drag and drop para qualquer usuário autenticado. A ordem dos cards dentro da coluna deve ser preservada (`position`).
- RF8: O sistema deve exibir no card a pontuação de Story Points definida pelo Planning Poker. O campo de pontuação do card deve ser preenchido automaticamente quando a tarefa for exportada da sala do Planning Poker, mas também pode ser preenchido/editado manualmente.
- RF9: O sistema deve fornecer um conjunto de filtros: por responsável, tags/temas, pontuação e data de vencimento.
- RF10: O sistema deve permitir aos usuários adicionar comentários de texto simples (até 2000 caracteres, sem Rich Text) nos cards.
- RF11: O sistema deve registrar e exibir um histórico básico e imutável de modificações no card (informando quem alterou e qual campo foi alterado). A criação de registros de histórico é feita exclusivamente no servidor.
- RF12: Ao excluir uma coluna personalizada, os cards que estavam nela devem ser movidos automaticamente para o fim da coluna "Aguardando" (`type = 'backlog'`), recebendo novas `position` na sequência dela. A exclusão é feita exclusivamente pelo servidor (mover cards + reindexar `position` + apagar a coluna, nessa ordem), com a `deleteRule` da coleção bloqueada — para que ninguém apague uma coluna direto pela API e deixe cards órfãos.
- RF13: O quadro é **único e global** para toda a instância: todo usuário autenticado vê o mesmo board e os mesmos cards. Não há boards por time/projeto nesta versão (ver Questões em aberto).

## Requisitos não funcionais

- Performance: alvo de **10 colunas × 200 cards** carregando em menos de 1s e arrasto sem perda perceptível de frames. O `load` traz colunas + cards numa consulta com `expand` de assignees; os filtros (RF9) são aplicados **no client**, sobre a lista já carregada (sem round-trip por filtro). Comentários e histórico são carregados sob demanda, ao abrir o card — nunca no `load` do board.
- Drag and drop: usar **`svelte-dnd-action`** (compatível com Svelte 5, com suporte nativo a navegação por teclado). É **obrigatório** que mover card e reordenar coluna funcionem também por teclado e anunciem a mudança a leitores de tela — DnD apenas por mouse não é aceito como pronto.
- Ordenação (`position`): inteiros esparsos por coluna. Ao mover um card, o servidor recalcula as `position` dos cards da coluna de origem e destino e persiste em lote. Concorrência é **last-write-wins** — dois usuários arrastando o mesmo card ao mesmo tempo resultam na última escrita vencendo, e o realtime reconcilia os demais clients. Não há locking nesta versão (board pequeno, uso cooperativo).
- Integração de UI e Segurança: Utilizar o Tiptap (que deverá ser instalado e configurado) para o Rich Text na edição dos cards. É **obrigatório** implementar sanitização do HTML (ex: via `sanitize-html` no server ou schema estrito) para evitar ataques de XSS armazenado, visto que as descrições dos cards serão exibidas para outros usuários. Os comentários são em texto simples e devem rejeitar HTML malicioso.
- Segurança de Auditoria: A coleção de histórico de cards deve ser protegida de modo que nem os próprios administradores possam editá-la ou excluí-la diretamente (`updateRule`/`deleteRule` bloqueadas).
- Granularidade das API Rules: o projeto assume **chamada direta à API** (`pocketbase-api-rules.mdc`), então nenhuma regra se contenta com "é autenticado". Em `kanban_cards` e `kanban_columns`, todas as regras de escrita são `null` e a mutação passa pelo servidor (form action → `kanbanAccess` → `getAdminClient()`): as form actions são as únicas que gravam `kanban_card_history` e as únicas que reindexam `position` em lote, então permitir escrita direta no PocketBase permitiria alterar cards **sem deixar rastro** e furar as invariantes de ordem das colunas fixas. A **única** escrita direta que o cliente faz no Kanban é criar/editar/apagar o **próprio comentário** — e ali a regra restringe campos (`@request.body.user:isset = false`, `@request.body.card:isset = false`), não só posse.
- Realtime: O `load` de `/kanban` retorna `pb.authStore.token` na `PageData`. O client usa `pocketbaseClient.ts` (já existente) para criar um PB browser-side, chama `pb.authStore.save(token, model)` e abre subscriptions em `kanban_cards`, `kanban_columns` e `kanban_card_comments`. A classe `KanbanBoard.svelte.ts` faz dedup por `id` ao mesclar eventos realtime.
- Tags: `tags` é um campo `json` contendo um array de strings (ex.: `["backend", "urgente"]`), digitadas livremente pelo usuário no card — não há coleção de tags nesta versão. O filtro por tag (RF9) é feito no client sobre a lista carregada.

## Critérios de aceite

- [ ] AC1: Dado que sou um administrador na tela do Kanban, posso criar novas colunas personalizadas e reordenar as intermediárias, garantindo que "Aguardando" seja sempre a primeira e "Feito" a última. Colunas fixas rejeitam tentativas de renomeio ou deleção via backend.
- [ ] AC2: Dado que tenho um card criado, posso usar o drag and drop para movê-lo de "Aguardando" para "Fazendo" ou qualquer outra coluna livremente, bem como reordená-lo dentro da mesma coluna.
- [ ] AC3: Ao criar ou editar um card, um editor Rich Text é apresentado para preencher sua descrição, sendo possível também definir/alterar múltiplos responsáveis. A inserção de scripts no editor não resulta em XSS ao visualizar.
- [ ] AC4: A pontuação final de um card oriundo da exportação do Planning Poker fica visível na interface do card no Kanban e pode ser alterada.
- [ ] AC5: Posso filtrar os cards pela pontuação, tag, responsável ou data de vencimento, e apenas os cards correspondentes serão exibidos.
- [ ] AC6: Posso visualizar uma área de comentários e adicionar novos comentários de texto simples em um card. Tentar enviar HTML não resulta em injeção.
- [ ] AC7: Posso visualizar um log de histórico no card indicando qual usuário realizou qual alteração. O log não pode ser alterado nem apagado.
- [ ] AC8: Ao apagar uma coluna como administrador, seus cards internos vão imediatamente para a coluna "Aguardando" de forma automática — e nenhum card fica órfão nem é apagado junto.
- [ ] AC9: Dado dois usuários com o board aberto, quando um move um card (ou cria/edita/comenta), então o outro vê a mudança em tempo real, sem recarregar a página.
- [ ] AC10 (segurança): Dado um usuário autenticado, quando tenta escrever **por chamada direta à API do PocketBase** — criar/alterar/apagar card, criar/renomear/mover/apagar coluna (inclusive um admin tentando arrastar "Aguardando" para o meio), ou alterar um registro de histórico —, então todas as operações são rejeitadas; a única escrita direta permitida é a do próprio comentário.
- [ ] AC12: Dado um card alterado pela aplicação (edição, movimentação, troca de responsáveis), então existe um registro de histórico correspondente — não há caminho de escrita que altere um card sem gerar histórico.
- [ ] AC11: Dado que navego o board apenas pelo teclado, então consigo mover um card entre colunas e reordená-lo dentro da coluna, com a mudança anunciada por leitor de tela.
- [ ] Testes unitários puros (`kanbanAccess.test.ts`) e E2E Playwright cobrindo os cenários acima.

## Design (Ports & Adapters — padrão real do projeto)

> **Nota:** o app `runes` **não** usa a abstração `Gateway`/`HttpGateway`/`MemoryGateway` de `packages/*-domain` para features do PocketBase. A lógica de negócio e persistência é feita via `+page.server.ts` chamando `locals.pb` diretamente, com a autorização isolada em funções puras testadas e o estado reativo em classes `.svelte.ts`. O Kanban utiliza _form actions_ para mutações e subscriptions do PocketBase para atualizações em realtime (ex: drag and drop).

| Camada | Mudança prevista |
|--------|-------------------|
| PocketBase | Migration cria `kanban_columns` (`name` text required, `position` number required, `type` select [`backlog`, `done`, `custom`] required, `created`/`updated` autodate) e faz o **seed das três colunas fixas** ("Aguardando" `backlog`, "Fazendo" `custom`, "Feito" `done`). API Rules: `listRule`/`viewRule` = `@request.auth.id != ''`; `createRule`/`updateRule`/`deleteRule` = `null` — **toda mutação de coluna é server-side** via `getAdminClient()`, após `kanbanAccess.canManageColumns` (admin). Motivo: (a) criar/mover/excluir coluna reindexa a `position` de **várias** colunas de uma vez, o que só é consistente em lote no servidor; (b) as invariantes do RF2 (`backlog` sempre primeira, `done` sempre última, fixas não renomeáveis nem excluíveis) dependem do `type` do record — uma `updateRule` que liberasse `position` para admins permitiria arrastar "Aguardando" para o meio por chamada direta à API; (c) o RF12 exige mover os cards **antes** de apagar a coluna, e uma `deleteRule` aberta deixaria cards órfãos. A relation `column` em `kanban_cards` **não** usa `cascadeDelete` (senão o delete apagaria os cards em vez de movê-los). |
| PocketBase | Migration cria `kanban_cards` (`title` text required, `description` editor/html (sanitizado no server), `column` relation → `kanban_columns` required maxSelect 1 **sem cascadeDelete**, `created_by` relation → `auth` required maxSelect 1, `assignees` relation multi → `auth`, `position` number required, `points` number nullable, `tags` json (array de strings), `due_date` date nullable, `created`/`updated` autodate — nomes em `snake_case`, como nas demais coleções do projeto). API Rules: `listRule`/`viewRule` = `@request.auth.id != ''` (board global, RF13); `createRule`/`updateRule`/`deleteRule` = `null` — **toda mutação de card passa pelo servidor** (form action → checagem em `kanbanAccess` → escrita via `getAdminClient()`). Motivo: as form actions são as únicas que gravam `kanban_card_history`; qualquer regra que permitisse escrita direta no PocketBase permitiria criar/alterar/apagar card **sem deixar rastro no histórico**, esvaziando o RF11 — inclusive um `create` direto, que nasceria sem registro de criação e com `position` arbitrária. Fechar a escrita é o que torna a auditoria confiável, e continua atendendo o RF7 (movimentação livre para qualquer autenticado), porque a permissão passa a ser decidida em `kanbanAccess`, não na API Rule. |
| PocketBase | Migration cria `kanban_card_comments` (`card` relation → `kanban_cards` required maxSelect 1 cascadeDelete, `user` relation → `auth` required maxSelect 1, `text` text required max 2000 chars, `created`/`updated` autodate). API Rules: `listRule`/`viewRule` = `@request.auth.id != ''`; `createRule` = `@request.auth.id != '' && @request.body.user = @request.auth.id`; `updateRule` = `user = @request.auth.id && @request.body.user:isset = false && @request.body.card:isset = false`; `deleteRule` = `user = @request.auth.id`. |
| PocketBase | Migration cria `kanban_card_history` (`card` relation → `kanban_cards` required maxSelect 1 cascadeDelete, `user` relation → `auth` required maxSelect 1, `field` text required, `created`/`updated` autodate). API Rules: `listRule`/`viewRule` = `@request.auth.id != ''`; `createRule` = `null` (escrito só pelo servidor via `getAdminClient()`); `updateRule`/`deleteRule` = `null` (imutável, nem admin altera — RNF de auditoria). |
| Domínio (função pura) | `apps/runes/src/lib/domain/kanbanAccess.ts` (`canManageColumns` (admin), `isFixedColumn`, `canRenameColumn`/`canMoveColumn`/`canDeleteColumn` (admin **e** `type = 'custom'`; mover só entre a primeira e a última posição, preservando as invariantes do RF2), `canDeleteCard` (criador ou admin), `canEditComment` (autor), `reorderPositions(cards, cardId, targetColumnId, targetIndex)` — recálculo puro das `position` de origem/destino, usado pelo `moveCard` e pela realocação do RF12) + `kanbanAccess.test.ts`. |
| Domínio reativo (client) | `apps/runes/src/lib/domain/KanbanBoard.svelte.ts` — classe com `$state` para colunas e cards, `subscribe` injetável (fake nos testes), dedup por `id` no merge dos eventos realtime, e `$derived` aplicando os filtros do RF9 no client. |
| Server | `apps/runes/src/lib/server/kanbanRecord.ts` (types das coleções) e `kanbanHistory.ts` (`recordFieldChanges(cardId, userId, before, after)` — diffa os campos alterados e grava um registro por campo via `getAdminClient()`; chamado por toda action que muta card). |
| Validação | `apps/runes/src/lib/validation/kanbanSchemas.ts` (`createCardSchema`, `updateCardSchema`, `createColumnSchema`, `addCommentSchema` com max 2000 chars e rejeição de HTML, `moveCardSchema`, `tagsSchema` — array de strings). |
| API | `apps/runes/src/routes/kanban/+page.server.ts` — `load` retorna colunas + cards (com assignees expandidos) + token realtime. _Form actions_ seguem a tabela de Contrato da API: validam com os schemas, checam permissão com `kanbanAccess` e escrevem via `getAdminClient()` (obrigatório para cards, cuja escrita direta está bloqueada), sempre chamando `recordFieldChanges` para alimentar o histórico. |
| UI | `apps/runes/src/lib/components/kanban/` (`Board.svelte`, `Column.svelte`, `Card.svelte`, `CardDetail.svelte` — comentários + histórico carregados sob demanda —, `Filters.svelte`, `RichTextEditor.svelte` com Tiptap), usando `svelte-dnd-action` para o DnD acessível por teclado. |

## Contrato de API (Form Actions)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/kanban` | — | Colunas (ordenadas) + cards (com assignees expandidos) + token realtime |
| POST (form action) | `/kanban` (`createColumn`) | `name` | `fail(400, {errors})` ou `fail(403)` se não admin |
| POST (form action) | `/kanban` (`renameColumn`) | `columnId, name` | `fail(403)` se coluna fixa (backlog/done) ou não admin |
| POST (form action) | `/kanban` (`moveColumn`) | `columnId, newPosition` | `fail(403)` se coluna fixa ou não admin |
| POST (form action) | `/kanban` (`deleteColumn`) | `columnId` | `fail(403)` se fixa/não admin; cards órfãos movidos para 'Aguardando' |
| POST (form action) | `/kanban` (`createCard`) | `title, description, columnId, assigneeIds[], tags?, due_date?, points?` | `fail(400, {errors})` se inválido; grava o registro de criação no histórico |
| POST (form action) | `/kanban` (`updateCard`) | `cardId, title?, description?, assigneeIds[]?, tags?, due_date?, points?` | `fail(400, {errors})`; `points` editável manualmente (RF8) |
| POST (form action) | `/kanban` (`moveCard`) | `cardId, targetColumnId, position` | `fail(400)`; reindexa as `position` das colunas de origem e destino |
| POST (form action) | `/kanban` (`deleteCard`) | `cardId` | `fail(403)` se não é o criador nem admin |
| POST (form action) | `/kanban` (`addComment`) | `cardId, text` | `fail(400, {errors})` |
| POST (form action) | `/kanban` (`deleteComment`) | `commentId` | `fail(403)` se não é o autor |

## Alternativas consideradas
- Editor de texto Markdown (TextArea simples): Descartado pois a edição em Rich Text melhora a experiência para descrever requisitos/tarefas de forma visual na descrição do card. Os comentários, porém, seguem em texto simples para reduzir sobrecarga de dados e segurança, visto que são menores e rápidos.
- **`updateRule` aberta em `kanban_cards`** (qualquer autenticado edita direto no PocketBase, com só os campos sensíveis travados): seria a regra mais simples e daria "movimentação livre" de graça, mas permitiria alterar cards por chamada direta à API **sem gerar histórico** — as form actions são as únicas que escrevem `kanban_card_history`. Optou-se por fechar `updateRule`/`deleteRule` (`null`) e centralizar a escrita no servidor, ao custo de o client não poder gravar direto no PocketBase.
- **Mutação de colunas pelo cliente** (regras admin-only no PocketBase, em vez de tudo server-side): descartado porque criar/mover/excluir coluna reindexa várias `position` de uma vez (só consistente em lote no servidor) e porque nenhuma regra de filtro impede um admin de arrastar a coluna fixa "Aguardando" para o meio por chamada direta à API, violando o RF2. Com a escrita fechada, as invariantes ficam em `kanbanAccess`, testadas como função pura.
- **Biblioteca de drag and drop:** `svelte-dnd-action` foi escolhida por ser a referência no ecossistema Svelte, ser compatível com Svelte 5 e — decisivo — trazer navegação por teclado e anúncios para leitor de tela nativamente. Implementar DnD à mão com a HTML Drag and Drop API foi descartado justamente por deixar a acessibilidade a cargo da implementação.
- **`position` fracionária / lexicographic rank** (inserir entre dois cards sem reescrever os vizinhos): descartado por YAGNI para o alvo de 200 cards por board — o recálculo em lote da coluna afetada é simples e barato nessa escala. Revisar se o board crescer muito.

## Questões em aberto

- Boards por time/projeto: hoje o quadro é único e global (RF13). Se surgir a necessidade de múltiplos boards, entra uma coleção `kanban_boards` e todas as API Rules passam a filtrar por membro do board.
- Se a sanitização de HTML do Tiptap será feita via `sanitize-html` no server ou via schema estrito do Tiptap (extensões permitidas) — mesma decisão pendente no Planning Poker.
- Histórico registra hoje apenas "quem alterou qual campo", sem valores antigo/novo. Guardar o diff (respeitando o tamanho do HTML da descrição) fica para uma iteração futura.

## Links
- Jira (após aprovação da spec): `docs/workflow/kanban.jira.md`
- Feature doc (pós-implementação): `docs/features/kanban.md`
- PR: `docs/workflow/kanban.pr.md`
- Depende de: [`pocketbase-auth`](./pocketbase-auth.md), [`pocketbase-user-crud`](./pocketbase-user-crud.md)
- Specs relacionadas: [`planning-poker`](./planning-poker.md) (exporta tasks votadas para este Kanban)
