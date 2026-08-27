# <Nome da Feature> — Plano

Criado: <YYYY-MM-DD>
Slug: <YYYY-MM-DD-<nome>>
Spec: [docs/specs/<slug>.md](./<slug>.md)

> Este é o **COMO** (R1). Toda decisão de stack, arquivo, rota, coleção e campo vive aqui — nunca na spec.

## Resumo

Como a feature será construída, em 2–3 frases, já nomeando a abordagem técnica.

## Contexto técnico

> Cada campo pode assumir o valor `PRECISA ESCLARECER` quando ainda não há resposta — isso entra na cota de esclarecimento.

| Campo | Valor |
|-------|-------|
| Linguagem / versão | SvelteKit (Svelte 5) + TypeScript |
| Dependências primárias | PocketBase, Zod, DaisyUI/Tailwind |
| Armazenamento | PocketBase (coleções + migrations) |
| Testes | Vitest (unit) + Playwright (e2e) |
| Plataforma | `apps/runes` (web) |
| Metas de performance | `PRECISA ESCLARECER` |
| Restrições | `PRECISA ESCLARECER` |
| Escala | `PRECISA ESCLARECER` |

## Constitution Check

| Princípio MUST | Como esta feature cumpre | Evidência |
|----------------|--------------------------|-----------|
| <princípio MUST da constituição> | <como esta feature o cumpre> | <seção/arquivo que comprova> |

> **Regra:** violação de princípio MUST **sem justificativa registrada** em `Complexity Tracking` (abaixo) **bloqueia a fase 3** (Tasks). Violação justificada não é erro — é exceção documentada.

## Estrutura de código

```
apps/runes/src/
├── lib/
│   ├── domain/
│   │   ├── <feature>Access.ts          # regras puras de permissão
│   │   ├── <feature>Access.test.ts     # testes do domínio (TDD)
│   │   └── <Feature>.svelte.ts         # classe reativa (realtime)
│   ├── server/
│   │   └── <feature>Record.ts          # tipos das coleções
│   ├── validation/
│   │   └── <feature>Schemas.ts         # schemas de validação
│   └── components/
│       └── <feature>/                  # componentes de UI
└── routes/
    └── <feature>/
        ├── +page.server.ts             # load + form actions (locals.pb)
        └── +page.svelte                # UI
```

## Camadas (Ports & Adapters — padrão real)

| Camada | Mudança prevista |
|--------|------------------|
| PocketBase (migration + API Rules) | migration cria `<coleção>` (`<campo>` tipo/constraints, `created`/`updated` autodate). `listRule` = …; `viewRule` = …; `createRule` = …; `updateRule` = …; `deleteRule` = … |
| Domínio puro | `apps/runes/src/lib/domain/<feature>Access.ts` — regras puras de permissão + testes |
| Domínio reativo `.svelte.ts` | `apps/runes/src/lib/domain/<Feature>.svelte.ts` — classe com `$state`, dedup por `id` |
| Tipos `*Record.ts` | `apps/runes/src/lib/server/<feature>Record.ts` — tipos das coleções |
| Validação Zod | `apps/runes/src/lib/validation/<feature>Schemas.ts` |
| Form actions | `apps/runes/src/routes/<feature>/+page.server.ts` — `load` + actions usando `locals.pb` |
| UI | `apps/runes/src/lib/components/<feature>/` + `apps/runes/src/routes/<feature>/+page.svelte` |

## Modelo de dados

| Coleção | Campos | Regras de acesso |
|---------|--------|------------------|
| `<coleção>` | `id`, `<campo>` (tipo), `created`, `updated` | `listRule` = …; `viewRule` = …; `createRule` = …; `updateRule` = …; `deleteRule` = … |

- `created`/`updated` são autodate — geridos pelo armazenamento, nunca pelo app.

## Contrato de API

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/<feature>` | — | `PageData` com os registros autorizados |
| POST (form action) | `/<feature>?/<acao>` | `campo1`, `campo2` | `{ success: true }` ou `fail(400, { errors })` |

## Estados de UI

| Estado | Comportamento / componente |
|--------|---------------------------|
| Loading | _skeleton/spinner — feedback imediato_ |
| Vazio | _mensagem de "nenhum item" + CTA para criar_ |
| Erro | _toast / alert inline — padrão do projeto_ |
| Sucesso | _feedback positivo (toast/redirect)_ |
| Offline | _badge de desconexão / fila de ações pendentes_ |

## Decisões técnicas

| Decisão | Racional | Alternativas rejeitadas |
|---------|----------|-------------------------|
| <decisão 1> | <por que> | <opções descartadas e motivo> |

## Memória aplicável

> Regra R11 — saída de `python3 ~/projects/agent-memory/scripts/memory.py code <caminho>` para **cada** caminho da árvore em `## Estrutura de código`, antes de escrever qualquer mudança.

- `<caminho>` → <achado relevante>

## Complexity Tracking

> Preencher **SOMENTE se o Constitution Check tem violação**. Sem violação, apague esta tabela.

| Violação | Por que é necessária | Alternativa simples rejeitada porque |
|----------|----------------------|--------------------------------------|
| <princípio MUST violado> | <justificativa> | <alternativa + motivo da rejeição> |
