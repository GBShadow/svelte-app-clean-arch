# <Summary — título curto da tarefa>

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | Medium |
| Labels | sveltekit, ports-adapters, classic |
| Story Points | 3 |
| Jira Key | [JIRA-KEY] |
| Epic | _(opcional)_ |

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

- [ ] AC1: Dado ..., quando ..., então ...
- [ ] AC2: ...
- [ ] Testes com `TodoMemoryGateway` passando
- [ ] `pnpm test` e `pnpm check` sem erros
- [ ] Documentação em `docs/features/<slug>.md`

## Technical Notes (Ports & Adapters — classic)

| Camada | Ação |
|--------|------|
| Domínio | `packages/todo-domain/src/observable/` |
| Gateway | `packages/todo-domain/src/gateways/` |
| Server | `apps/classic/src/lib/server/` |
| API | `apps/classic/src/routes/api/` |
| UI | `Feature.svelte` + `FeatureContainer.svelte` |
| Testes | `*.test.ts` com `TodoMemoryGateway` |

## Links

- Spec: `docs/specs/<slug>.md`
- Feature doc: `docs/features/<slug>.md`
- PR (após implementação): `docs/workflow/<slug>.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks (opcional)

- [ ] Domínio e gateways
- [ ] API e server store
- [ ] UI e Container
- [ ] Testes
- [ ] Documentação + PR
