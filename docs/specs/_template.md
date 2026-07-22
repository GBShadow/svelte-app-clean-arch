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

## Impactos e Dependências

- **Features existentes afetadas:** _listar components, rotas, coleções PocketBase que precisarão de adaptação_
- **Dívida técnica existente relacionada:** _consultar `docs/TECH-DEBT.md`; mencionar itens que impactam esta feature_
- **Dependências:** _specs/features que esta tarefa depende (ex: precisa de migração X antes)_
- **Specs relacionadas:** _outras specs no mesmo ecossistema_

## Requisitos funcionais

- RF1: O sistema deve ...
- RF2: ...
- RF-TDD: **Todo código de produção deve ser precedido pelo teste que o exige** (Red-Green-Refactor). Nenhuma implementação é aceita sem o teste correspondente escrito primeiro.

## Requisitos não funcionais

_(performance, acessibilidade, segurança, testes — se aplicável)_

- **Segurança**: Analisar preventivamente XSS (campos de texto rico), IDOR, escalação de privilégios e vazamentos via PocketBase realtime subscriptions. Documentar as mitigações nos RNFs e ACs.
- **Realtime** (se aplicável): O `load` retorna `pb.authStore.token` na `PageData`. O client usa `pocketbaseClient.ts` (já existente) para criar um PB browser-side, chama `pb.authStore.save(token, model)` antes de abrir subscriptions. Classe reativa (`.svelte.ts`) faz dedup por `id`.

## Casos de Borda e Cenários de Erro

- **Concorrência:** _o que acontece se dois usuários acionam a mesma ação simultaneamente?_
- **Dados inconsistentes:** _como o sistema reage se o estado do banco não reflete o esperado?_
- **Timeout / falha de rede:** _qual o comportamento quando uma requisição falha?_
- **Estado vazio:** _o que aparece quando não há dados?_
- **Permissão negada:** _qual o fluxo quando o usuário não tem acesso a um recurso?_
- **Input inválido / malicioso:** _como a validação rejeita e reporta?_
- **Sessão expirada:** _o que acontece quando o token do PocketBase expira durante o uso?_
- **Cache / realtime inconsistente:** _como garantir que o dado exibido reflete o estado atual?_

## Critérios de aceite

- [ ] AC1: Dado ..., quando ..., então ...
- [ ] AC2: ...
- [ ] Testes unitários puros escritos **antes** da implementação (TDD): (`<feature>Access.test.ts`) e E2E Playwright cobrindo os cenários acima.
- [ ] `pnpm test` passa antes da abertura do PR.

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

## UI/UX (Estados)

| Estado | Comportamento / Componente |
|--------|---------------------------|
| **Loading** | _skeleton, spinner, shimmer — qual o feedback imediato?_ |
| **Empty** | _mensagem de "nenhum item", call-to-action para criar?_ |
| **Error** | _toast, inline alert, tela de erro — qual o padrão?_ |
| **Success** | _feedback positivo após ação (toast, redirect, transição)?_ |
| **Offline** | _badge de desconexão, fila de ações pendentes?_ |

## Contrato de API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/<feature>` | — | ... |
| POST (form action) | `/<feature>` (`<action>`) | `campo1, campo2` | `fail(400, {errors})` se inválido |

## Alternativas consideradas

Trade-offs entre abordagens e por que esta foi escolhida (opcional).

## Análise de Risco e Dívida Técnica

- **Riscos identificados:** _ex: dependência externa instável, escala futura não contemplada, segurança_
- **Dívida técnica aceita:** _o que estamos simplificando agora que precisará ser refeito depois?_
- **Dívida existente resolvida junto:** _itens de `docs/TECH-DEBT.md` que serão corrigidos como parte desta feature_
- **Itens registrados em `docs/TECH-DEBT.md`:** _links para os novos itens criados durante esta spec_

## Questões em aberto

- ...

## Links

- Jira (após aprovação da spec): `docs/workflow/<slug>.jira.md`
- Feature doc (pós-implementação): `docs/features/<slug>.md`
- PR: `docs/workflow/<slug>.pr.md`
- Depende de: [`<spec>`](./spec.md)
- Specs relacionadas: [`<spec>`](./spec.md)
