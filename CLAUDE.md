# svelte-app-clean-arch — Guia para Claude

Monorepo SvelteKit com **Ports & Adapters**: app `runes` + pacote compartilhado `packages/todo-domain`.

> **Nota:** Os apps `classic` e `remote` foram movidos para `deprecated/classic` e `deprecated/remote`. Eles não fazem mais parte do workspace ativo.

## Regra principal

**Novas funcionalidades = padrão runes**.

## Regras (`.cursor/rules/` + `.agents/skills/` — manter sincronizados)

| Pasta         | Arquivo                      | Propósito                                                                                                       |
| ------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| architecture  | `runes-ports-adapters.mdc`   | Ports & Adapters (runes)                                                                                        |
| architecture  | `language-convention.mdc`    | Idioma: código em inglês, UI/erros em português                                                                 |
| architecture  | `data-testid.mdc`            | data-testid em componentes + getByTestId nos testes                                                             |
| architecture  | `pocketbase-collections.mdc` | Toda coleção PocketBase precisa dos campos `created`/`updated`                                                  |
| architecture  | `pocketbase-api-rules.mdc`   | API Rules (`update`/`delete`) devem restringir campos, não só posse/participação — assumir chamada direta à API |
| architecture  | `icon-library-imports.mdc`   | Ícones (lucide-svelte etc.) importados por sub-path, nunca via barrel — barrel compila o pacote inteiro         |
| architecture  | `error-handling.mdc`         | Todo catch de operação best-effort precisa logar o erro — nunca `.catch(() => {})` silencioso                   |
| documentation | `feature-documentation.mdc`  | Doc em `docs/features/` + CHANGELOG                                                                             |
| workflow      | `spec-driven.mdc`            | Spec em `docs/specs/<slug>.md` (antes de implementar)                                                           |
| workflow      | `pr-description.mdc`         | PR em `docs/workflow/<slug>.pr.md`                                                                              |
| workflow      | `jira-tasks.mdc`             | Jira em `docs/workflow/<slug>.jira.md`                                                                          |
| meta          | `rules-sync.mdc`             | Sincronizar Cursor ↔ Freebuff ↔ Claude                                                                          |
| meta          | `commit-convention.mdc`      | Sem trailer de co-autoria em commits/PRs                                                                        |
| meta          | `code-structure.mdc`         | Ler CODE-STRUCTURE.md antes; atualizar docs depois                                                              |
| meta          | `lessons-learned.mdc`        | Todo problema não trivial resolvido deve ser registrado (regra, feature doc ou memória), não só corrigido       |
| meta          | `tech-debt.mdc`              | Débito técnico identificado e **não corrigido na hora** deve ser registrado em `docs/TECH-DEBT.md` (documento vivo) |

PR e Jira ficam na **mesma pasta** `docs/workflow/`, com o mesmo `<slug>`.

No Claude Code, `spec-driven` é um **agente** (`.claude/agents/spec-driven.md`), não uma skill nativa — invocar via ferramenta `Agent` com `subagent_type: "spec-driven"`. Existe também um wrapper em `.claude/skills/spec-driven/SKILL.md` que delega para esse agente, para o caso de a skill ser acionada diretamente (ex.: `Skill(spec-driven)`/`/spec-driven`).

Skills Freebuff (`.agents/skills/`):

- `spec-driven` — agente de processo spec-driven
- `runes-ports-adapters` — guia de implementação runes
- `classic-ports-adapters` — guia de implementação classic (deprecated)
- `feature-documentation` — documentação de funcionalidades
- `language-convention` — convenção de idioma
- `code-structure` — ler CODE-STRUCTURE.md antes; atualizar docs depois
- `data-testid` — adicionar data-testid em componentes + usar getByTestId
- `pocketbase-collections` — toda coleção PocketBase precisa dos campos `created`/`updated`
- `pocketbase-api-rules` — API Rules de update/delete devem restringir campos, não só posse/participação
- `icon-library-imports` — ícones (lucide-svelte etc.) importados por sub-path, nunca via barrel
- `error-handling` — todo catch de operação best-effort precisa logar o erro, nunca `.catch(() => {})` silencioso
- `lessons-learned` — todo problema não trivial resolvido deve ser registrado, não só corrigido
- `tech-debt` — débito técnico identificado e não corrigido na hora deve ser registrado em `docs/TECH-DEBT.md` (documento vivo)
- `verify-before-accept` — disciplina de evidência: lidere com o teste, cubra o caminho real, verifique seus próprios fixes

## Leitura prioritária e Segurança

**Antes de iniciar qualquer tarefa ou especificação**, você DEVE OBRIGATORIAMENTE:

1. Ler `docs/CODE-STRUCTURE.md` para entender a estrutura atual do projeto e a arquitetura real.
2. Analisar todos os impactos de segurança do que será desenvolvido (ex: XSS em campos de texto rico, vazamento de dados via PocketBase realtime subscriptions e IDOR).
3. Nunca ignorar as regras do banco de dados (ler regras `.cursor/rules/architecture/pocketbase-*.mdc` antes de desenhar entidades do PocketBase).

## Documentação e workflow (spec-driven)

| Quando                                          | Arquivo                        | Template                          |
| ----------------------------------------------- | ------------------------------ | --------------------------------- |
| Antes de implementar (nova feature não trivial) | `docs/specs/<slug>.md`         | `docs/specs/_template.md`         |
| Criar tarefa Jira                               | `docs/workflow/<slug>.jira.md` | `docs/workflow/_template-jira.md` |
| Concluir feature                                | `docs/features/<slug>.md`      | `docs/features/_template.md`      |
| Changelog                                       | `docs/CHANGELOG.md`            | —                                 |
| Criar PR                                        | `docs/workflow/<slug>.pr.md`   | `docs/workflow/_template-pr.md`   |

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
9. `docs/TECH-DEBT.md` — se um débito técnico foi identificado (e não corrigido na hora) ou resolvido durante a tarefa. Ver `.cursor/rules/meta/tech-debt.mdc`

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

## Verify-before-accept (disciplina de evidência)

Princípio-mestre: **só confio no que eu toco.** Evidência bate inferência —
sempre. Quando os dois divergem, a hipótese a revisar é a minha, não a medição.

### O ato (determinístico — não é "quando eu lembrar")

Antes de afirmar uma causa, dar um diagnóstico como fechado, ou marcar algo
como "pronto/funcionando":

1. **Lidere com o TESTE que discrimina, não com o palpite.** Um bom teste
   separa as hipóteses concorrentes — se o resultado não muda qual hipótese
   sobrevive, não é o teste certo. Rode-o antes de concluir.
2. **Cheque se a prova cobre o caminho REAL.** Um teste que passa por um
   caminho vizinho não prova o caminho do sistema. (Ex.: um `curl http://` na
   :80 responder NÃO prova que o app, que fala `https://` na :443, conecta.
   Provou a :80 — não a :443.)
3. **Verifique seus PRÓPRIOS fixes e o veredito de subagentes/ferramentas.**
   Um verificador pode confabular a partir de dado real (má atribuição). Um
   "guard não-pulável" pode ser ilusório. Re-teste o resultado, não defenda o
   veredito. O verify-before-accept alcança inclusive o que VOCÊ acabou de
   consertar.
4. **Receber ≠ aceitar.** Todo report, handoff, deliverable ou resposta de
   ferramenta é ANALISADO antes de ser propagado — o objetivo da análise é
   achar os pontos que FALTAM, não confirmar o que veio.

### Não encolha o mapa

Sob pressão, o viés é **estreitar o que falta**: tratar "o que destrava X"
como "o que falta em X"; "a capacidade existe" como "o trabalho foi feito";
"o happy-path funciona" como "está pronto". Meça o estado REAL antes de
afirmar o tamanho. Se o interlocutor (mesmo o mais sênior) simplifica o
escopo e algo não fecha, **segure o mapa real** — inclusive contra ele.

### Como reportar

- Diga o que você mediu e o que apenas inferiu — explicitamente.
- Se um teste falhou, diga, com a saída. Se um passo foi pulado, diga.
- Quando algo está feito E verificado, afirme sem rodeios. Sem verificação,
  não afirme "funciona" — diga "não verifiquei X".
- Ao errar um palpite e a medição refutar: nomeie o palpite refutado
  ("Refutado meu palpite de scheme — o printenv deu http.")

## Ver também

- `.agents/skills/verify-before-accept.md` — skill Freebuff equivalente
