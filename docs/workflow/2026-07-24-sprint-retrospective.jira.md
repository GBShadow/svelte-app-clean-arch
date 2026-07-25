# Retrospectiva de Sprint

Created: 2026-07-24

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | Medium |
| Labels | sveltekit, ports-adapters, runes, retro |
| Story Points | 8 |
| Jira Key | [JIRA-KEY] |
| Epic | _(opcional)_ |

## Description

### Contexto

Times de desenvolvimento realizam retrospectivas ao final de cada sprint para inspecionar como o trabalho foi conduzido e planejar melhorias. O projeto já possui gerenciamento de projetos, sprints, kanban e planning poker, mas não há uma ferramenta dedicada para colher o feedback anônimo da equipe durante a retro.

### Objetivo

Criar um quadro de retrospectiva anônimo por sprint, com colunas configuráveis, cards rich text, token de edição anônimo, lista de participantes gerenciada pelo responsável e bloqueio total após finalização.

### Escopo

**Incluído:**
- 1 retro por sprint, 3 colunas padrão + custom reordenáveis
- Cards rich text com token de edição anônimo (hash SHA-256, sem `created_by`)
- Mover cards entre colunas (qualquer participante)
- Moderação: responsável exclui qualquer card
- Lista de participantes gerenciada manualmente pelo responsável
- Finalização: zera tokens, bloqueia mutações permanentemente
- Realtime + DnD + notificações push/in-app ao finalizar
- Visível apenas para participantes do projeto

**Fora do escopo:**
- Reabrir retro finalizada
- Votação em cards
- Exportar conteúdo
- Múltiplas retros simultâneas

## Acceptance Criteria

- [ ] AC1: Responsável cria retro para sprint → 3 colunas padrão criadas
- [ ] AC2: Participante cria card → recebe `edit_token`; pode editar/excluir com o token
- [ ] AC3: Participante sem `edit_token` tenta editar card → 403
- [ ] AC4: Qualquer participante move card entre colunas por DnD
- [ ] AC5: Responsável finaliza retro → status `finalized`, todos `edit_token_hash` zerados, mutações bloqueadas
- [ ] AC6: Responsável adiciona/remove participantes
- [ ] AC7: Lista de participantes exibida na UI
- [ ] AC8: Responsável pode excluir qualquer card (moderação)
- [ ] AC9: Notificação push/in-app enviada ao finalizar
- [ ] AC10: Token inválido → 403
- [ ] AC11: Coluna só pode ser excluída se vazia
- [ ] AC12: DnD de colunas persiste via realtime
- [ ] AC13: `pnpm test` passa

## Technical Notes (Ports & Adapters — runes)

| Camada | Ação |
|--------|------|
| PocketBase | 4 migrations (`retrospectives`, `retrospective_participants`, `retrospective_columns`, `retrospective_cards`). API Rules: `listRule`/`viewRule` restritas a project.participants; write = null. |
| Domínio | `retroAccess.ts` (funções de permissão puras) + `editToken.ts` (geração/verificação de token) |
| Domínio reativo | `RetroBoard.svelte.ts` com `$state`, `$derived`, realtime subscriptions |
| Server | `retroRecord.ts` (tipos) |
| Validação | `retroSchemas.ts` (Zod) |
| API | `routes/projects/[projectId]/sprints/[sprintId]/retro/+page.server.ts` (load + actions) |
| UI | `routes/projects/[projectId]/sprints/[sprintId]/retro/+page.svelte` + `lib/components/retro/` |
| Testes | E2E Playwright cobrindo cenários AC1–AC13 (nota: E2E dependem de resolver bloqueador `$env` do TECH-DEBT) |

## Links

- Spec: `docs/specs/2026-07-24-sprint-retrospective.md`
- Feature doc: `docs/features/2026-07-24-sprint-retrospective.md`
- PR (após implementação): `docs/workflow/2026-07-24-sprint-retrospective.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks (opcional)

- [ ] Domínio e acesso (retroAccess.ts, editToken.ts)
- [ ] Server types e validação (retroRecord.ts, retroSchemas.ts)
- [ ] API — server actions + load
- [ ] UI — board, colunas, cards, DnD, participante list, modais
- [ ] Realtime + notificações
- [ ] Testes E2E
- [ ] Documentação + PR
