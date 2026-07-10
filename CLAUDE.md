# svelte-app-clean-arch — Guia para Claude

Monorepo SvelteKit com **Ports & Adapters**: app `runes` + pacote compartilhado `packages/todo-domain`.

> **Nota:** Os apps `classic` e `remote` foram movidos para `deprecated/classic` e `deprecated/remote`. Eles não fazem mais parte do workspace ativo.

## Regra principal

**Novas funcionalidades = padrão runes**.

## Regras (`.cursor/rules/` + `.agents/skills/` — manter sincronizados)

| Pasta | Arquivo | Propósito |
|-------|---------|-----------|
| architecture | `runes-ports-adapters.mdc` | Ports & Adapters (runes) |
| architecture | `language-convention.mdc` | Idioma: código em inglês, UI/erros em português |
| architecture | `data-testid.mdc` | data-testid em componentes + getByTestId nos testes |
| architecture | `pocketbase-collections.mdc` | Toda coleção PocketBase precisa dos campos `created`/`updated` |
| documentation | `feature-documentation.mdc` | Doc em `docs/features/` + CHANGELOG |
| workflow | `spec-driven.mdc` | Spec em `docs/specs/<slug>.md` (antes de implementar) |
| workflow | `pr-description.mdc` | PR em `docs/workflow/<slug>.pr.md` |
| workflow | `jira-tasks.mdc` | Jira em `docs/workflow/<slug>.jira.md` |
| meta | `rules-sync.mdc` | Sincronizar Cursor ↔ Freebuff ↔ Claude |
| meta | `commit-convention.mdc` | Sem trailer de co-autoria em commits/PRs |
| meta | `code-structure.mdc` | Ler CODE-STRUCTURE.md antes; atualizar docs depois |

PR e Jira ficam na **mesma pasta** `docs/workflow/`, com o mesmo `<slug>`.

Skills Freebuff (`.agents/skills/`):
- `spec-driven` — agente de processo spec-driven
- `runes-ports-adapters` — guia de implementação runes
- `classic-ports-adapters` — guia de implementação classic (deprecated)
- `feature-documentation` — documentação de funcionalidades
- `language-convention` — convenção de idioma
- `code-structure` — ler CODE-STRUCTURE.md antes; atualizar docs depois
- `data-testid` — adicionar data-testid em componentes + usar getByTestId
- `pocketbase-collections` — toda coleção PocketBase precisa dos campos `created`/`updated`

## Leitura prioritária: CODE-STRUCTURE.md

**Antes de iniciar qualquer tarefa**, leia `docs/CODE-STRUCTURE.md` para entender a estrutura
atual do projeto, localizar arquivos relevantes e identificar a camada correta para as mudanças.

## Documentação e workflow (spec-driven)

| Quando | Arquivo | Template |
|--------|---------|----------|
| Antes de implementar (nova feature não trivial) | `docs/specs/<slug>.md` | `docs/specs/_template.md` |
| Criar tarefa Jira | `docs/workflow/<slug>.jira.md` | `docs/workflow/_template-jira.md` |
| Concluir feature | `docs/features/<slug>.md` | `docs/features/_template.md` |
| Changelog | `docs/CHANGELOG.md` | — |
| Criar PR | `docs/workflow/<slug>.pr.md` | `docs/workflow/_template-pr.md` |

Fluxo: **spec → Jira → implementar → feature doc → PR**, mesmo `<slug>` em todos. Bugfixes triviais podem pular a spec.

Índice: [docs/README.md](./docs/README.md)

## Estrutura do projeto

```
apps/runes/              # App SvelteKit ativo (default)
deprecated/
  classic/               # App classic — descontinuado
  remote/                # App remote — descontinuado
packages/todo-domain/   # Domínio e gateways compartilhados
docs/                    # Documentação
```

## Comandos

```bash
pnpm install && pnpm test && pnpm check
pnpm dev:runes     # :5175 (frontend apenas)
pnpm dev:full      # backend (só sobe se parado) + frontend juntos
pnpm backend:reset # derruba, apaga volume Docker e sobe fresco
pnpm dev:reset     # backend:reset + frontend
# ou via turbo:
turbo run backend:dev | backend:down | backend:reset | dev:full | dev:reset
gh pr create --body-file docs/workflow/<slug>.pr.md
```

## Commits e PRs

Sem trailer de co-autoria (`Co-Authored-By: Claude ...`) em commits ou PRs deste repositório.

## Atualização de Documentos ao Concluir Tarefas

Ao **concluir qualquer tarefa**, verifique e atualize **todos os documentos relevantes**:

1. `docs/CODE-STRUCTURE.md` — se a estrutura de arquivos/pastas mudou
2. `CLAUDE.md` — se regras, skills ou comandos mudaram
3. `README.md` (raiz) — se a visão geral, apps ou comandos mudaram
4. `docs/README.md` — se o índice da documentação mudou
5. `docs/CHANGELOG.md` — se uma feature foi concluída
6. `docs/features/<slug>.md` + índice — se feature implementada
7. `docs/specs/<slug>.md` + índice — se spec criada
8. `docs/workflow/<slug>.pr.md` / `<slug>.jira.md` + índice — se PR/Jira preparados

Ver regra completa em `.cursor/rules/meta/code-structure.mdc`.

## Manutenção de regras

1. Atualizar `.cursor/rules/<pasta>/<nome>.mdc` (Cursor)
2. Atualizar `.agents/skills/<nome>.md` (Freebuff)
3. Atualizar este `CLAUDE.md`
4. Atualizar `README.md` e `docs/README.md`
5. Atualizar `docs/CODE-STRUCTURE.md` (estrutura do código)
6. Atualizar `docs/CHANGELOG.md`, `docs/features/`, `docs/specs/`, `docs/workflow/` (se aplicável)

## Idioma

Código (variáveis, funções, comentários, nomes de tabelas/colunas no banco) em **inglês**. Texto voltado ao usuário — UI e mensagens de erro/validação retornadas ao usuário — em **português**. Documentação (specs, PR, Jira, features, CHANGELOG) em português. Ver `.cursor/rules/architecture/language-convention.mdc`.

## Runes (default)

UI → Container (`onMount` + `service.load()`) → `TodoListService` (`$lib/domain/*.svelte.ts`, com `$state`/`$derived`) → `TodoHttpGateway` → `/api/` → `$lib/server/*Store.ts`. Testes com `TodoMemoryGateway`.
