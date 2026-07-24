# Correção do Export de Tasks do Planning Poker

Created: 2026-07-23

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Bug |
| Priority | High |
| Labels | sveltekit, runes, planning-poker, kanban |
| Story Points | 2 |
| Jira Key | [JIRA-KEY] |

## Description

### Contexto

O export de tasks do Planning Poker para o Kanban é silenciosamente
ignorado: o usuário clica em "Exportar Selecionadas", o fetch retorna
`{ success: true }` mesmo sem criar cards, e nenhum feedback é exibido.
Além disso, o painel de export aparece mesmo quando a sala não está
finalizada.

### Objetivo

Tasks pontuadas podem ser exportadas para o Kanban após finalizar a
sala, com validação de dados, feedback visual de sucesso/erro e
painel de export condicional à sala finalizada.

### Escopo

**Incluído:**
- Schema Zod `exportToKanbanSchema`
- Validação de taskIds no backend antes de processar
- Erro 400 se task não tem `final_points` (em vez de skip silencioso)
- Toast de sucesso ao exportar, toast de erro se falhar
- Painel de export visível apenas quando `roomStatus === 'finalized'`
- Testes do schema

**Fora do escopo:**
- Mudanças no fluxo de votação/pontuação
- Mudanças no Kanban
- Testes E2E

## Acceptance Criteria

- [ ] AC1: Admin com sala finalizada + tasks pontuadas → Exportar cria cards + toast
- [ ] AC2: Botão desabilitado se nenhuma task selecionada
- [ ] AC3: Painel invisível se sala não finalizada
- [ ] AC4: Task sem final_points → erro 400
- [ ] AC5: Task já exportada → erro 400
- [ ] AC6: Após export, tasks com status "No Kanban"
- [ ] AC7: Falha no export → toast de erro
- [ ] `pnpm test` e `pnpm check` sem erros

## Technical Notes

| Camada | Mudança |
|--------|---------|
| Validação | `pokerSchemas.ts`: add `exportToKanbanSchema` |
| API | `+page.server.ts`: validar schema, `fail(400)` em vez de `continue` |
| UI | `TaskList.svelte`: painel condicional a `roomStatus === 'finalized'` |
| UI | `+page.svelte`: `handleExport` trata response com `toastStore.add` |

## Links

- Spec: `docs/specs/2026-07-23-poker-export-fix.md`
