# <Nome da Feature>

Created: <YYYY-MM-DD>

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

_(performance, acessibilidade, segurança, testes — se aplicável)_

- **Segurança**: Analisar preventivamente XSS (campos de texto rico), IDOR, escalação de privilégios e vazamentos via PocketBase realtime subscriptions. Documentar as mitigações nos RNFs e ACs.
- **Realtime** (se aplicável): O `load` retorna `pb.authStore.token` na `PageData`. O client usa `pocketbaseClient.ts` (já existente) para criar um PB browser-side, chama `pb.authStore.save(token, model)` antes de abrir subscriptions. Classe reativa (`.svelte.ts`) faz dedup por `id`.

## Critérios de aceite

- [ ] AC1: Dado ..., quando ..., então ...
- [ ] AC2: ...
- [ ] Testes unitários puros (`<feature>Access.test.ts`) e E2E Playwright cobrindo os cenários acima.

## Design (Ports & Adapters — padrão real do projeto)

> **Nota:** o app `runes` **não** usa a abstração `Gateway`/`HttpGateway`/`MemoryGateway` de `packages/todo-domain` para features PocketBase — isso é resquício de uma versão anterior do projeto. O padrão real (como em `chat-realtime`) faz as mutações via _form actions_ (`+page.server.ts` chamando `locals.pb`), com a lógica de autorização isolada em funções puras (`$lib/domain/...`) e estado reativo consumindo subscriptions (`.svelte.ts`).

| Camada | Mudança prevista |
|--------|-------------------|
| PocketBase | Migration cria `<coleção>` (`campo` tipo constraints, `created`/`updated` autodate). API Rules: `listRule` = ...; `viewRule` = ...; `createRule` = ...; `updateRule` = ...; `deleteRule` = ... |
| Domínio (função pura) | `apps/runes/src/lib/domain/<feature>Access.ts` (regras puras de permissão) + testes |
| Domínio reativo (client) | `apps/runes/src/lib/domain/<Feature>.svelte.ts` — classe com `$state`, recebe subscriptions realtime, dedup por `id` |
| Server (types) | `apps/runes/src/lib/server/<feature>Record.ts` (tipos das coleções) |
| Validação | `apps/runes/src/lib/validation/<feature>Schemas.ts` (Zod schemas) |
| API | `apps/runes/src/routes/<feature>/+page.server.ts` — `load` + form actions usando `locals.pb.collection(...)` |
| UI | `apps/runes/src/lib/components/<feature>/` |

_(A partir de 2026-07-09, `classic` e `remote` foram movidos para `deprecated/`. Toda nova funcionalidade usa `apps/runes`.)_

## Contrato de API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/<feature>` | — | ... |
| POST (form action) | `/<feature>` (`<action>`) | `campo1, campo2` | `fail(400, {errors})` se inválido |

## Alternativas consideradas

Trade-offs entre abordagens e por que esta foi escolhida (opcional).

## Questões em aberto

- ...

## Links

- Jira (após aprovação da spec): `docs/workflow/<slug>.jira.md`
- Feature doc (pós-implementação): `docs/features/<slug>.md`
- PR: `docs/workflow/<slug>.pr.md`
- Depende de: [`<spec>`](./spec.md)
- Specs relacionadas: [`<spec>`](./spec.md)
