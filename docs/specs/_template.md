# <Nome da Feature>

## Contexto

Qual problema existe hoje? Por que essa funcionalidade é necessária?

## Objetivo

O que deve existir ao final, em 1–2 frases.

## Escopo

**Incluído:**
- ...

**Fora do escopo:**
- ...

## Requisitos funcionais

- RF1: O sistema deve ...
- RF2: ...

## Requisitos não funcionais

_(performance, acessibilidade, testes — se aplicável)_

## Critérios de aceite

- [ ] AC1: Dado ..., quando ..., então ...
- [ ] AC2: ...
- [ ] Testes com `TodoMemoryGateway` cobrindo os cenários acima

## Design (Ports & Adapters — padrão runes)

| Camada | Mudança prevista |
|--------|-------------------|
| Domínio reativo | `apps/runes/src/lib/domain/*.svelte.ts` |
| Gateway (porta) | `packages/todo-domain/src/gateways/...` |
| Server | `apps/runes/src/lib/server/...` |
| API | `apps/runes/src/routes/api/...` |
| UI | `apps/runes/src/lib/components/...` |

_(A partir de 2026-07-09, `classic` e `remote` foram movidos para `deprecated/`. Toda nova funcionalidade usa `apps/runes`.)_

## Contrato de API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/api/...` | — | ... |

## Alternativas consideradas

Trade-offs entre abordagens e por que esta foi escolhida (opcional).

## Questões em aberto

- ...

## Links

- Jira (após aprovação da spec): `docs/workflow/<slug>.jira.md`
- Feature doc (pós-implementação): `docs/features/<slug>.md`
- PR: `docs/workflow/<slug>.pr.md`
