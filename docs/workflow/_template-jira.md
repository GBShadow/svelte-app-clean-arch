# <Summary — título curto da tarefa>

Created: <YYYY-MM-DD>

> Este arquivo é **derivado** de `docs/specs/<slug>.tasks.md` (fase 4). Não o redija do zero: copie os `AC-###` da spec e a quebra de trabalho dos `T###`. A fonte da verdade é sempre `docs/specs/<slug>.*`.

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | Medium |
| Labels | sveltekit, ports-adapters, runes |
| Story Points | 3 |
| Jira Key | [JIRA-KEY] |
| Epic | _(opcional)_ |

> Nunca invente uma Jira Key — deixe o placeholder `[JIRA-KEY]` até a ferramenta real gerar a chave.

## Description

### Contexto

Por que esta tarefa existe? Qual problema resolve?

### Objetivo

O que deve ser entregue ao concluir?

### Escopo

**Incluído:**
- ...

**Fora do escopo:**
- ...

## Acceptance Criteria

> Copie cada `AC-###` de `docs/specs/<slug>.md` **citando o id**. Não parafraseie sem o id — é ele que mantém a rastreabilidade com a spec e com os testes.

- [ ] AC-001: Dado ..., quando ..., então ...
- [ ] AC-002: ...
- [ ] Toda `RF-###` da spec coberta por ≥1 `T###` de `docs/specs/<slug>.tasks.md`
- [ ] `pnpm test` verde (todas as tasks `[X]`)

## Technical Notes (padrão real — apps/runes)

> Ver `.cursor/rules/architecture/runes-ports-adapters.mdc`. Form actions em `+page.server.ts` chamam `locals.pb`; domínio puro em `.svelte.ts`; Zod em `$lib/validation`; tipos em `$lib/server/*Record.ts`.

| Camada | Ação |
|--------|------|
| Domínio | `apps/runes/src/lib/domain/` (classes reativas `.svelte.ts` com `$state`/`$derived`) |
| Validação | `apps/runes/src/lib/validation/` (schemas Zod) |
| Tipos | `apps/runes/src/lib/server/*Record.ts` |
| Server | form actions em `+page.server.ts` chamando `locals.pb` |
| UI | componentes Svelte (runes) em `apps/runes/src/lib/` |
| Testes | `*.test.ts` cobrindo domínio puro e schemas Zod |

## Links

- Spec: `docs/specs/<slug>.md`
- Plan: `docs/specs/<slug>.plan.md`
- Tasks: `docs/specs/<slug>.tasks.md`
- Checklist: `docs/specs/<slug>.checklist.md`
- Feature doc (após implementação): `docs/features/<slug>.md`
- PR (após implementação): `docs/workflow/<slug>.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

> Quebre a partir de `docs/specs/<slug>.tasks.md`, referenciando os `T###`.

- [ ] T001: <descrição>
- [ ] T002: <descrição>
- [ ] Testes
- [ ] Documentação + PR
