# SvelteKit Todo App — Ports & Adapters

Monorepo SvelteKit demonstrando o padrão Ports & Adapters, com foco no app **runes** (Svelte 5 Runes).

Gerenciado com **pnpm workspaces** + **Turborepo**.

## App ativo

| App | Domínio | Server | Porta |
|---|---|---|---|
| `apps/runes` | Runes em `.svelte.ts` | PocketBase REST + SvelteKit | 5175 |

## Apps descontinuados

Os apps `classic` e `remote` foram movidos para `deprecated/`:

| App | Localização | Domínio original |
|---|---|---|
| `classic` | `deprecated/classic` | Observable/Observer + REST `/api/todos` |
| `remote` | `deprecated/remote` | Observable/Observer + Remote functions |

## Pacote compartilhado

`packages/todo-domain` contém:

- `observable/` — `TodoList extends Observable`, `Observer`
- `gateways/` — `TodoGateway`, `TodoMemoryGateway`, `TodoHttpGateway`, `TodoRemoteGateway`
- `types.ts` — `TodoItemDTO`, `createId`, `SEED_TODOS`

## Documentação

- [Índice geral](./docs/README.md)
- [Arquitetura runes](./docs/runes-ports-adapters.md) — Ports & Adapters com `$state`/`$derived`, passo a passo
- [Specs](./docs/specs/) — spec-driven development, antes de implementar
- [Features](./docs/features/) — documentação por funcionalidade
- [Workflow](./docs/workflow/) — PR e Jira na mesma pasta
- [Estrutura do Código](./docs/CODE-STRUCTURE.md) — mapa completo da estrutura do projeto
- [Changelog](./docs/CHANGELOG.md) — histórico resumido
- [Playwright e2e](./docs/testing/playwright.md) — testes de browser (app runes)

## Regras para agentes de IA

Regras em `.cursor/rules/<pasta>/` e `.agents/skills/` — resumo em [`CLAUDE.md`](./CLAUDE.md).

| Local | Conteúdo |
|-------|----------|
| `.cursor/rules/architecture/runes-ports-adapters.mdc` | Ports & Adapters (runes) |
| `.cursor/rules/architecture/language-convention.mdc` | Idioma: código em inglês, UI/erros em português |
| `.cursor/rules/architecture/data-testid.mdc` | data-testid em componentes + getByTestId em testes |
| `.cursor/rules/architecture/pocketbase-collections.mdc` | Toda coleção PocketBase precisa dos campos `created`/`updated` |
| `.cursor/rules/architecture/pocketbase-api-rules.mdc` | API Rules de update/delete devem restringir campos, não só posse/participação |
| `.cursor/rules/documentation/feature-documentation.mdc` | Doc features + CHANGELOG |
| `.cursor/rules/workflow/spec-driven.mdc` | `docs/specs/<slug>.md` (antes de implementar) |
| `.cursor/rules/workflow/pr-description.mdc` | `docs/workflow/<slug>.pr.md` |
| `.cursor/rules/workflow/jira-tasks.mdc` | `docs/workflow/<slug>.jira.md` |
| `.cursor/rules/meta/rules-sync.mdc` | Sincronizar Cursor ↔ Freebuff ↔ Claude |
| `.cursor/rules/meta/commit-convention.mdc` | Sem trailer de co-autoria em commits/PRs |
| `.cursor/rules/meta/lessons-learned.mdc` | Todo problema não trivial resolvido deve ser registrado, não só corrigido |
| `.cursor/rules/meta/tech-debt.mdc` | Débito técnico identificado e não corrigido na hora deve ser registrado em [`docs/TECH-DEBT.md`](./docs/TECH-DEBT.md) (documento vivo) |
| `.agents/skills/` | Skills Freebuff (spec-driven, data-testid, code-structure, pocketbase-collections, pocketbase-api-rules, lessons-learned, tech-debt, etc.) |

## Antes de implementar

**Sempre leia [docs/CODE-STRUCTURE.md](./docs/CODE-STRUCTURE.md) primeiro** para entender a estrutura atual do projeto e localizar os arquivos corretos antes de fazer alterações.

## Ao concluir

Após implementar, atualize **Cursor** (`.cursor/rules/`), **Freebuff** (`.agents/skills/`), **CLAUDE.md**, **README**, **docs/README.md** e **docs/CODE-STRUCTURE.md** conforme necessário.

## Comandos

```bash
pnpm install
pnpm test
pnpm test:e2e
pnpm build
pnpm check

pnpm dev:runes        # frontend apenas (porta 5175)
pnpm dev:full         # backend (PocketBase, só sobe se parado) + frontend juntos
pnpm backend:reset    # derruba, apaga volume Docker e sobe backend fresco
pnpm dev:reset        # backend:reset + frontend runes

# via turbo diretamente
pnpm turbo run test --filter=todo-domain
```

### Testes e2e (Playwright)

Na **primeira vez** em Linux/WSL:

```bash
pnpm test:e2e:install
```

Guia completo: [docs/testing/playwright.md](./docs/testing/playwright.md)

## Testabilidade

O app runes pode ser testado com `TodoMemoryGateway`, sem depender de API real ou server-side.
