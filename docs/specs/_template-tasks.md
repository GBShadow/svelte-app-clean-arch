# <Nome da Feature> — Tasks

Criado: <YYYY-MM-DD>
Slug: <YYYY-MM-DD-<nome>>
Spec: [docs/specs/<slug>.md](./<slug>.md)
Plan: [docs/specs/<slug>.plan.md](./<slug>.plan.md)

> **Formato de task (R5):** `- [ ] T001 [P] [US1] Descrição com caminho exato do arquivo`.
> - `T###` = id estável de largura fixa (R4), nunca renumerado nem reciclado.
> - `[P]` marca task **paralelizável** — **somente** se os arquivos são disjuntos das demais tasks da mesma fase e não há dependência pendente.
> - `[US1]` = user story de origem (rastreabilidade).
> - A descrição termina no **caminho exato** do arquivo que a task cria ou altera.
> - Fases: `Fase 1: Setup` → `Fase 2: Fundação` (**BLOQUEIA todas as user stories**) → `Fase 3..N` (uma por user story, ordem `P1..Pn`, cada uma terminando em `**Checkpoint**`) → `Fase final: Polimento`.

## Rastreabilidade

| RF/SC | Tasks |
|-------|-------|
| RF-001 | T002 |
| RF-002 | T005 |
| SC-001 | T006 |

> **Regra:** requisito (`RF-###` / `SC-###`) **sem nenhuma task** = achado **CRITICAL** no analyze (R7). Nenhuma RF fica sem dono.

## Fase 1: Setup

- [ ] T001 [P] [US1] Criar o tipo `apps/runes/src/lib/server/<feature>Record.ts`
- [ ] T002 [P] [US1] Criar o schema `apps/runes/src/lib/validation/<feature>Schemas.ts`

## Fase 2: Fundação

> **BLOQUEIA todas as user stories** — nada de UI/story avança antes destas tasks.

- [ ] T003 [US1] Criar a migration da coleção `<coleção>` em `pocketbase/pb_migrations/<NNNN>_<colecao>.js`
- [ ] T004 [US1] Implementar as regras puras `apps/runes/src/lib/domain/<feature>Access.ts` com testes `apps/runes/src/lib/domain/<feature>Access.test.ts` (Red-Green-Refactor)

## Fase 3: US1 — <título da story>

- [ ] T005 [US1] `apps/runes/src/routes/<feature>/+page.server.ts` — `load` + form action `<acao>` (TDD: teste Red antes da implementação)
- [ ] T006 [US1] `apps/runes/src/lib/components/<feature>/<Componente>.svelte` — UI
- [ ] T007 [US1] `apps/runes/src/lib/domain/<Feature>.svelte.ts` — classe reativa (apenas se a story usa realtime)

**Checkpoint** — US1 entrega valor sozinha; validar com o usuário antes de avançar.

## Fase final: Polimento

- [ ] T0XX [US1] <acessibilidade, estados de borda, limpeza, cobertura de testes e2e>

## Dependências e ordem de execução

- T003 → T005 (a migration precisa existir antes do `load`/action)
- T004 → T005 (as regras puras são consumidas pela form action)

## Oportunidades de paralelismo

- T001 e T002 são `[P]` (arquivos disjuntos, sem dependência entre si)
- T005 e T007 são `[P]` (server vs. client, sem sobreposição de arquivos)

## Estratégia de entrega

- **MVP = US1** — entregar a story de maior prioridade completa e validada primeiro.
- **Parar em cada `**Checkpoint**`** e validar com o usuário antes da próxima story.
- Gate da fase 5: todas as tasks `[X]` e `pnpm test` verde.

---

> **Nota (R8):** a seção `## Fase N: Convergência` é **anexada por `spec-converge`** ao final da implementação — **nunca escrita à mão**. Não crie esta seção manualmente.
