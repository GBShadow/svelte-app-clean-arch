# Retrospectiva de Sprint

Created: 2026-07-24

## Contexto

Times de desenvolvimento realizam retrospectivas ao final de cada sprint para inspecionar como o trabalho foi conduzido e planejar melhorias. O projeto já possui gerenciamento de projetos (`projects`), sprints (`sprints`), kanban e planning poker, mas não há uma ferramenta dedicada para colher o feedback anônimo da equipe durante a retro.

## Objetivo

Um quadro de retrospectiva anônimo por sprint, com colunas configuráveis para agrupar cards, onde os participantes registram feedback anônimo (o que foi bom, o que foi ruim, o que melhorar) e ao final o responsável encerra a retro — congelando todo o conteúdo e removendo definitivamente qualquer rastro de autoria.

## Escopo

**Incluído:**
- Uma retrospectiva por sprint (chave única `project` + `sprint`)
- 3 colunas padrão criadas no setup: "O que foi bom", "O que foi ruim", "A melhorar para a próxima sprint"
- Responsáveis do projeto podem criar, renomear, reordenar e excluir colunas (só coluna vazia). Participantes podem reordenar colunas via DnD
- Cards rich text (reuso do Tiptap + `apps/runes/src/lib/server/richTextSanitize.ts` — mesma allowlist do kanban) com criação, edição, exclusão
- Anonimato real: nenhum campo de autoria (`created_by`) no banco
- **Token de edição**: ao criar um card, o servidor gera um `edit_token` aleatório de 32 bytes; apenas o hash SHA-256 é salvo no DB; o token plano é retornado **uma única vez** ao cliente, que o persiste no `localStorage` (`cardId → token`)
- **Edição/exclusão de card**: exige `edit_token` válido (hash confere). Sem token → 403
- **Mover cards**: permitido a qualquer participante da retro (não exige token)
- **Moderação**: responsável do projeto pode excluir qualquer card (sem ver autor), mesmo sem token
- Participantes: responsável **adiciona** manualmente os membros que participarão (lista própria na retro, independente de quem visitou a página)
- Finalizar retro (ação do responsável): status `open → finalized`, apaga `edit_token_hash` de todos os cards, bloqueia qualquer mutação posterior
- Lista de participantes exibida na retro (nomes + avatares, sem ligação com cards)
- Realtime via subscriptions PocketBase + classe `.svelte.ts` reativa
- Visível apenas para participantes do projeto via API Rules (com `listRule`/`viewRule` restritas a `project.participants`); só convidados da retro podem interagir (criar/mover cards)
- Notificações (push + in-app) quando retro for finalizada

**Fora do escopo:**
- Reabrir retro finalizada
- Votação em cards (like/dislike)
- Exportar conteúdo da retro para outro formato (PDF, markdown)
- Múltiplas retros simultâneas por sprint
- Edição/exclusão anônima cross-device (token é local ao browser; perder token = perder direito de editar/excluir — assumido como trade-off)

## Impactos e Dependências

- **Features existentes afetadas:** Nenhuma — é uma feature nova. O seletor de projeto existente pode ser reusado ou adaptado na UI.
- **Dívida técnica existente relacionada:** Nenhum item em `docs/TECH-DEBT.md` afeta esta área.
- **Dependências:** Precisa das coleções `projects` e `sprints` (migration 0021 já aplicada).
- **Specs relacionadas:** Nenhuma.

## Requisitos funcionais

- RF1: O sistema deve permitir que responsáveis do projeto criem uma retrospectiva para uma sprint específica (1 por sprint).
- RF2: O sistema deve criar automaticamente 3 colunas padrão ao criar a retro.
- RF3: O sistema deve permitir que participantes convidados criem cards rich text em qualquer coluna.
- RF4: O sistema deve retornar um `edit_token` único ao criar um card, usado pela UI para autorizar edição/exclusão posterior.
- RF5: O sistema deve permitir que o dono do `edit_token` edite o conteúdo do card e exclua o card.
- RF6: O sistema deve permitir que **qualquer participante** da retro mova cards entre colunas.
- RF7: O sistema deve permitir que o responsável do projeto adicione/remova participantes da retro.
- RF8: O sistema deve exibir a lista de participantes convidados na tela da retro.
- RF9: O sistema deve permitir que responsáveis criem, renomeiem, reordenem e excluam colunas.
- RF9a: O sistema deve impedir a exclusão de coluna se houver cards nela.
- RF9b: O sistema deve permitir que participantes reordenem colunas via DnD (acessibilidade por teclado).
- RF10: O sistema deve permitir que responsáveis finalizem a retro. Ao finalizar:
  - status = `finalized`;
  - `edit_token_hash` de todos os cards é zerado (nulificado);
  - qualquer mutação (criar/editar/excluir/mover card, criar/editar coluna) é bloqueada.
- RF11: O sistema deve bloquear qualquer ação de escrita após o status `finalized`.
- RF12: O sistema deve permitir que o responsável exclua qualquer card (moderação), mesmo sem token.
- RF13: O sistema deve notificar (push + in-app) todos os participantes quando a retro for finalizada.
- RF-TDD: Todo código de produção deve ser precedido pelo teste que o exige (Red-Green-Refactor).

## Requisitos não funcionais

- **Segurança**:
  - XSS: conteúdo dos cards é rich text sanitizado no servidor via `sanitize-html` (mesmo allowlist do kanban).
  - IDOR: toda ação verifica se o usuário é participante da retro e se a retro pertence a um projeto que o usuário pode acessar.
  - Token: `edit_token` armazenado como hash SHA-256 no DB; server nunca retorna o hash ao client. A rota que cria o card é a única oportunidade de obter o token plano.
  - Anonimato: o campo `edit_token_hash` existe apenas para verificação de posse — não é um identificador de usuário. Não há relação entre card e `user`/`auth`. A classe reativa `RetroBoard.svelte.ts` faz strip do `edit_token_hash` dos eventos realtime antes de merge no `$state`.
  - `edit_token_hash` não é exposto em nenhuma resposta de API, subscription ou page data — apenas o token plano (uma vez no create) chega ao client.
- **Realtime**: via PocketBase subscriptions. Classe `.svelte.ts` com `$state`/`$derived` + dedup por `id`.
- **Permissões de coleção no PocketBase**: `listRule`/`viewRule` restritas a participantes do projeto (ex: `@request.auth.id != '' && (retro.project.participants ?= @request.auth.id || @request.auth.isAdmin = true)`). `createRule`, `updateRule`, `deleteRule` = `null` (tudo via admin client).
- **Performance**: uma retro raramente terá mais de 100 cards; sem preocupações de escala.
- **Testes**: E2E Playwright cobrindo criação de retro, adição de participantes, criação/movimentação/exclusão de cards, DnD, finalização e bloqueio pós-finalização.
  - **Nota:** Testes E2E dependem da resolução do bloqueador documentado em `docs/TECH-DEBT.md` (Playwright + `$env`). Até lá, cobertura via Vitest + validação manual em `pnpm dev:full`.

## Casos de Borda e Cenários de Erro

- **Concorrência:** dois usuários movendo o mesmo card simultaneamente — a posição final será a da última requisição processada. O realtime propaga a atualização para todos.
- **Token perdido:** usuário que perdeu o `edit_token` (trocou de browser/limpou cache) não consegue editar/excluir o card. Ação esperada: pedir ao responsável para excluir via moderação.
- **Finalizar com cards em movimento:** a action de finalizar processa antes ou depois do movimento; o estado final é consistente (transação única via admin client).
- **Estado vazio (antes de qualquer card):** mensagem "Nenhum card nesta coluna" + CTA para criar.
- **Permissão negada:** card que não é do usuário + sem token → ação de editar/excluir retorna 403 silencioso (não revela existência do token).
- **Input malicioso:** rich text sanitizado; tags não permitidas são removidas.
- **Sessão expirada:** redireciona para /login (padrão do hooks.server.ts).

## Critérios de aceite

- [ ] AC1: Dado um projeto com sprint ativa, quando um responsável acessa a retro da sprint, então vê 3 colunas padrão.
- [ ] AC2: Dado um card criado, quando o criador envia o `edit_token` junto com a requisição de edição, então o card é atualizado.
- [ ] AC3: Dado um card criado, quando outro participante (sem token) tenta editar, então recebe 403.
- [ ] AC4: Dado um card criado, quando qualquer participante arrasta o card para outra coluna, então o card muda de coluna.
- [ ] AC5: Dada a retro finalizada, quando um participante tenta criar/editar/excluir qualquer card, então a ação é rejeitada (403).
- [ ] AC6: Dada a retro finalizada, quando se consulta a coleção `retrospective_cards`, então `edit_token_hash` é `null` em todos os registros.
- [ ] AC7: Dada uma retro `open`, quando o responsável exclui um card via moderação, então o card some sem necessidade de token.
- [ ] AC8: Dada uma retro, quando o responsável adiciona um participante, então o participante aparece na lista e pode criar/mover cards.
- [ ] AC9: Dada uma retro, quando o responsável remove um participante, então o participante some da lista e não pode mais criar cards (ações rejeitadas com 403).
- [ ] AC10: Dado um card com `edit_token` válido, quando o usuário recarrega a página e tenta editar, então o token está em `localStorage` e a edição funciona.
- [ ] AC11: Dado um card com `edit_token`, quando um participante envia um token inválido (hash não confere), então recebe 403.
- [ ] AC12: Dado um responsável, quando cria uma nova coluna, então a coluna aparece para todos os participantes via realtime.
- [ ] AC13: Dado um responsável, quando reordena colunas via DnD, então a ordem persiste para todos via realtime.
- [ ] AC14: Dada uma coluna com cards, quando o responsável tenta excluí-la, então a exclusão é rejeitada com mensagem "Coluna precisa estar vazia".
- [ ] AC15: Dada a retro finalizada, quando a notificação é enviada, então todos os participantes recebem push + in-app.
- [ ] AC16: Testes unitários puros escritos antes da implementação (TDD): (`retroAccess.test.ts`, `editToken.test.ts`) e E2E Playwright cobrindo os cenários acima.
- [ ] AC17: `pnpm test` passa antes da abertura do PR.

## Design (Ports & Adapters)

| Camada | Mudança prevista |
|--------|-------------------|
| PocketBase | Migration cria `retrospectives` (`project` ->projects, `sprint` ->sprints unique, `status` open\|finalized, `created_by` ->user, `finalized_at` datetime, `finalized_by` ->user), `retrospective_participants` (`retro` ->retrospectives, `user` ->user unique pair), `retrospective_columns` (`retro`, `name`, `position` number, `is_default` bool), `retrospective_cards` (`retro`, `column`, `content` rich text, `position`, `edit_token_hash` string? nullable). API Rules: `listRule`/`viewRule` = `@request.auth.id != '' && (retro.project.participants ?= @request.auth.id || @request.auth.isAdmin = true)`; write rules = null. `created`/`updated` autodate. |
| Domínio (função pura) | `apps/runes/src/lib/domain/retroAccess.ts` — `canViewRetro(user, retro, project)`, `canManageRetro(user, retro, project)`, `canParticipate(user, retro, participants)`, `canModerate(user, retro, project)` (responsável), `isRetroFinalized(retro)`, `reorderPositions(items)` — recálculo de posições contíguas |
| Domínio reativo (client) | `apps/runes/src/lib/domain/RetroBoard.svelte.ts` — classe com `$state` para `columns`, `cards`, `participants`, `retro`; `$derived`; `start()`/`stop()` para subscriptions realtime; `sync()`; dedup por `id`. `editTokens` em `Map<cardId, string>` (do `localStorage`). |
| Server (types) | `apps/runes/src/lib/server/retroRecord.ts` — `RetroRecord`, `RetroParticipantRecord`, `RetroColumnRecord`, `RetroCardRecord` |
| Validação | `apps/runes/src/lib/validation/retroSchemas.ts` — Zod schemas para createCard, editCard, moveCard, createColumn, addParticipant, finalize |
| API | `apps/runes/src/routes/projects/[projectId]/sprints/[sprintId]/retro/+page.server.ts` — load + actions: `createRetro`, `createColumn`, `renameColumn`, `reorderColumns`, `createCard`, `editCard`, `deleteCard`, `moveCard`, `addParticipant`, `removeParticipant`, `finalize` |
| UI | `apps/runes/src/routes/projects/[projectId]/sprints/[sprintId]/retro/+page.svelte` + `apps/runes/src/lib/components/retro/` (board, column, card, participant list, editor modal) |
| Serviço de token | `apps/runes/src/lib/server/editToken.ts` — `generateEditToken()` (32 bytes random + SHA-256 hash), `verifyEditToken(token, hash)` |

## UI/UX (Estados)

| Estado | Comportamento / Componente |
|--------|---------------------------|
| **Loading** | Skeleton das colunas (3 placeholders) |
| **Empty (sem retro)** | Mensagem "Nenhuma retrospectiva para esta sprint" + botão "Criar retro" (visível se responsável) |
| **Empty (coluna sem cards)** | Placeholder "Nenhum card" + botão "+" |
| **Error** | Toast de erro padrão do app |
| **Success** | Card aparece/desaparece animado; toast ao finalizar |
| **Finalized** | Banner "Retrospectiva finalizada" no topo; todos os inputs desabilitados; modo leitura |

## Contrato de API

Todas as mutações via form actions em `projects/[projectId]/sprints/[sprintId]/retro`.

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| POST | `?/createRetro` | — | `redirect(303, /projects/{pid}/sprints/{sid}/retro)` |
| POST | `?/createColumn` | `name` | `{ success: true }` ou `fail(400)` |
| POST | `?/renameColumn` | `columnId, name` | `{ success: true }` ou `fail(400)` |
| POST | `?/reorderColumns` | `orderedIds: string[]` | `{ success: true }` ou `fail(400)` |
| POST | `?/deleteColumn` | `columnId` | `{ success: true }` ou `fail(400)` (se não vazia) |
| POST | `?/createCard` | `columnId, content` | `json({ cardId, editToken })` |
| POST | `?/editCard` | `cardId, content, editToken` | `{ success: true }` ou `fail(400, 403)` |
| POST | `?/deleteCard` | `cardId, editToken?` | `{ success: true }` ou `fail(400, 403)` |
| POST | `?/moveCard` | `cardId, targetColumnId, position` | `{ success: true }` |
| POST | `?/addParticipant` | `userId` | `{ success: true }` ou `fail(400)` |
| POST | `?/removeParticipant` | `userId` | `{ success: true }` |
| POST | `?/finalize` | — | `{ success: true }` |

## Alternativas consideradas

**Token de edição vs. `created_by` oculto:** Optou-se pelo token anônimo porque nem mesmo o administrador do servidor consegue associar um card a um usuário (o hash não é reversível e não há metadado adicional). A desvantagem (perda de edição ao trocar de dispositivo) é explicitada na UI.

**Rota com sprintId vs. auto-detecção:** Optou-se por rota explícita (`/projects/[id]/sprints/[sprintId]/retro`) para clareza e consistência RESTful, evitando ambiguidade quando o projeto tem múltiplas sprints.

## Análise de Risco e Dívida Técnica

- **Riscos identificados:**
  - Token perdido: usuário não consegue editar/excluir card. Mitigação: responsável pode moderar (excluir). Para edição, o usuário recria o card.
  - Hash SHA-256 não é suficiente para anonimato se combinado com outros dados — como salvamos apenas o hash e nenhum outro metadado (timestamp de criação não é individualizado), o risco de reidentificação é negligenciável.
  - Bloqueador conhecido: testes E2E Playwright falham com `$env` (ver `docs/TECH-DEBT.md`). Até resolver, cobertura via Vitest + validação manual.
- **Dívida técnica aceita:** Token armazenado apenas no `localStorage` — sem sincronização cross-device. Aceito como trade-off do anonimato real.
- **Dívida existente resolvida junto:** Nenhuma.
- **Itens registrados em `docs/TECH-DEBT.md`:** Nenhum.

## Questões em aberto

- N/A — todas as decisões foram fechadas com o usuário.

## Links

- Jira (após aprovação da spec): `docs/workflow/2026-07-24-sprint-retrospective.jira.md`
- Feature doc (pós-implementação): `docs/features/2026-07-24-sprint-retrospective.md`
- PR: `docs/workflow/2026-07-24-sprint-retrospective.pr.md`
- Depende de: Nenhuma
- Specs relacionadas: Nenhuma
