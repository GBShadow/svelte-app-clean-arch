# svelte-app-clean-arch — Guia para Antigravity

Monorepo SvelteKit com **Ports & Adapters**: app `runes` + pacote compartilhado `packages/todo-domain`.

> **Nota:** Os apps `classic` e `remote` foram movidos para `deprecated/classic` e `deprecated/remote`. Eles não fazem mais parte do workspace ativo.

## Regra principal

**Novas funcionalidades = padrão runes**.

## Verify-before-accept (disciplina de evidência) — OBRIGATÓRIA

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

## Débito técnico — OBRIGATÓRIA

Sempre que você identificar, durante uma spec, code review, implementação ou investigação, um
débito técnico real (bug latente, simplificação arriscada, gap de segurança não bloqueante,
inconsistência entre spec e código, teste faltando, dependência desatualizada) que **não vai
corrigir agora** — registre em [`docs/TECH-DEBT.md`](./docs/TECH-DEBT.md) antes de seguir em
frente. Não é o mesmo que `lessons-learned`/`tech-debt` para problema já corrigido — é
especificamente para o que ficou pendente. Siga o formato já descrito no próprio arquivo. Ao
resolver um item já listado, mova-o para "Resolvidos" com data e PR/commit. Ver
`.agents/skills/tech-debt.md` para o detalhamento completo da regra.

## Leitura prioritária e Segurança

**Antes de iniciar qualquer tarefa ou especificação**, você DEVE OBRIGATORIAMENTE:

1. Ler `docs/CODE-STRUCTURE.md` para entender a estrutura atual do projeto e a arquitetura real.
2. Analisar todos os impactos de segurança do que será desenvolvido (ex: XSS em campos de texto rico, vazamento de dados via PocketBase realtime subscriptions e IDOR).
3. Nunca ignorar as regras do banco de dados (ler regras em `.agents/skills/pocketbase-*.md` antes de desenhar entidades do PocketBase).

## Idioma

Código (variáveis, funções, comentários, nomes de tabelas/colunas no banco) em **inglês**. Texto voltado ao usuário — UI e mensagens de erro/validação retornadas ao usuário — em **português**. Documentação (specs, PR, Jira, features, CHANGELOG) em português.

## Commits e PRs — OBRIGATÓRIO

- Sem trailer de co-autoria (`Co-Authored-By: Claude ...`) em commits ou PRs deste repositório.
- **Toda documentação relevante deve ser atualizada antes de commitar ou abrir PR.** Consulte `.agents/skills/commit-and-pr-docs.md` para a lista de documentos a verificar (CODE-STRUCTURE, CHANGELOG, features, ROUTES, LESSONS-LEARNED, TECH-DEBT, etc.). Commits e PRs que alteram código sem atualizar a documentação correspondente serão rejeitados.

## Comandos disponíveis

- `implement <slug>` — ciclo completo spec-driven em 7 fases: spec-creator (spec/esclarecimentos/plan/tasks) → spec-reviewer (checklist/analyze) → frontend/backend/test-writer → spec-converge → docs-writer, com pausa e gate em cada fase. Definição em `.opencode/command/implement.md`.
- `checkpoint` — salva estado da sessão em `docs/sessions/` e sincroniza docs versionados (CHANGELOG, CODE-STRUCTURE, ROUTES, TECH-DEBT, LESSONS-LEARNED, features) via docs-writer, antes de /clear ou commit. Definição em `.opencode/command/checkpoint.md`.
- `audit-sync` — auditoria de drift entre código e docs (ROUTES, CODE-STRUCTURE, CHANGELOG, TECH-DEBT, specs/features). Toca o stamp `.opencode/.audit-sync-stamp` (lido pelo plugin). Definição em `.opencode/command/audit-sync.md`.
- `review` — revisão completa de código: análise técnica, lint/typecheck, testes,
  documentação (CODE-STRUCTURE, CHANGELOG, features, tech-debt), lições aprendidas e
  análise de impacto. Aceita commit, branch, PR ou nada (mudanças não commitadas).
  Definição em `.opencode/command/review.md`.

## Agentes disponíveis (`.opencode/agents/` e `.omp/agents/` — espelhados)

- `spec-creator` — spec, esclarecimentos, plan e tasks (Fases 1 e 3)
- `spec-reviewer` — checklist (Fase 2) e analyze read-only (Fase 4)
- `spec-converge` — convergência append-only sobre `.tasks.md` (Fase 6)
- `bug-assess` — triagem de bug: assessment → fix → test, com veredito `verificado | parcial | falhou`
- `frontend` / `backend` — implementação (Fase 5), com TDD
- `test-writer` — testes unitários (Vitest) e e2e (Playwright)
- `docs-writer` — feature doc, CHANGELOG e PR (Fase 7)
- `code-reviewer`, `debugger`, `infra`, `refactorer`, `e2e-writer` — apoio

## Fluxo spec-driven (7 fases) e regras de processo

Pipeline por feature — 5 artefatos principais (`docs/specs/<slug>.md`, `<slug>.checklist.md`, `<slug>.plan.md`, `<slug>.tasks.md` e `docs/features/<slug>.md`), além de `docs/workflow/<slug>.jira.md` e `<slug>.pr.md` derivados, todos com o mesmo `<slug>`:

| Fase | Artefato | Dono | Gate |
| --- | --- | --- | --- |
| 1 Spec + Esclarecimentos | `docs/specs/<slug>.md` | `spec-creator` | ≤3 `[PRECISA ESCLARECER]` |
| 2 Checklist | `docs/specs/<slug>.checklist.md` | `spec-reviewer` | itens `CHK###` marcados pelo usuário |
| 3 Plan + Tasks | `docs/specs/<slug>.plan.md` + `.tasks.md` | `spec-creator` | Constitution Check sem violação injustificada |
| 4 Analyze | relatório read-only | `spec-reviewer` | 0 achados `CRITICAL` |
| 5 Implementação | código (TDD) | `frontend`/`backend`/`test-writer` | tasks `[X]` + `pnpm test` verde |
| 6 Convergência | append em `.tasks.md` | `spec-converge` | `✅ Convergido` |
| 7 Documentação | `docs/features/<slug>.md` + CHANGELOG + PR | `docs-writer` | — |

Regras de processo (resumo literal — lidas em toda sessão):

- **R1 Spec sem stack.** A spec descreve o QUÊ e o PORQUÊ: proibido nome de framework, biblioteca, arquivo, rota, coleção, campo de banco, componente. Tudo isso vive no `.plan.md`. Única exceção: sistema externo já em produção quando o requisito é de compatibilidade.
- **R2 Ambiguidade com teto.** Marque `[PRECISA ESCLARECER: pergunta]`, máximo 3 por spec. Default óbvio → assuma e registre em `## Premissas`. Mais de 3 = feature grande demais → `.roadmap.md`.
- **R6 Checklist é do revisor.** Itens interrogativos sobre a REDAÇÃO do requisito, não sobre o software. O agente nunca marca `[x]`; quem implementa lê como gate e não altera marcadores.
- **R8 Convergência append-only.** Nunca edita/apaga código, nunca reescreve tasks existentes. Classifica: `ausente | parcial | contradiz | não-solicitado`. Violação de constituição = `CRITICAL` primeiro. Próximo id `T{M+1:03d}`. Saída `✅ Convergido` ou `↻ N tarefas anexadas`.
- **R10 Persistência flow-forward.** Spec aprovada é registro histórico. Mudança de rumo = nova spec com `Supersede:`; a antiga recebe `Status: superada por`. Proibido reescrever spec aprovada para caber no implementado.
- **R12 TDD é MUST.** Nenhuma linha de produção sem o teste que a exige (Red-Green-Refactor). Permanece como `RNF-TDD` na spec.

## Skills disponíveis (`.opencode/skills/` — carregadas pelo opencode)

As skills são versionadas em `.opencode/skills/<nome>/SKILL.md` (formato opencode). A fonte
original para o ecossistema Claude/Cursor continua em `.agents/skills/` — **regra de sync:**
qualquer mudança de regra deve refletir em ambos os lugares (`.opencode/skills/` e
`.agents/skills/`).

- `verify-before-accept` — disciplina de evidência (esta regra — detalhada acima)
- `runes-ports-adapters` — guia de implementação runes
- `classic-ports-adapters` — guia de implementação classic (deprecated)
- `feature-documentation` — documentação de funcionalidades
- `language-convention` — convenção de idioma
- `code-structure` — ler CODE-STRUCTURE.md antes; atualizar docs depois
- `data-testid` — adicionar data-testid em componentes + usar getByTestId
- `pocketbase-collections` — toda coleção PocketBase precisa dos campos `created`/`updated`
- `pocketbase-api-rules` — API Rules de update/delete devem restringir campos
- `client-realtime-and-actions` — form actions client + boards realtime: o que NÃO fazer
- `error-handling` — catch silencioso é bug invisível (`.catch(() => {})` nunca)
- `icon-library-imports` — ícones por sub-path (`lucide-svelte/icons/*`), nunca barrel
- `lessons-learned` — todo problema não trivial resolvido deve ser registrado
- `tech-debt` — débito técnico identificado e não corrigido na hora deve ser registrado em `docs/TECH-DEBT.md`
- `checkpoint` — salva estado da sessão para retomar depois em nova sessão
- `spec-driven` — agente de processo spec-driven
- `spec-converge` — convergência append-only sobre `.tasks.md` (nunca reescreve tasks, classifica achados)
- `bug-triage` — triagem de bug com veredito: assessment → fix → test (`verificado | parcial | falhou`)
- `commit-and-pr-docs` — atualizar toda documentação ao criar commits e PRs
- `context7-mcp` — busca de docs de bibliotecas via Context7

## Plugin de sessão (`.opencode/plugin/session-changes.ts`)

- Edits/Writes em `apps/` e `packages/` são registrados em `.opencode/.session-changes.log` (gitignored) — consumido pelo `docs-writer` (`/checkpoint`, `/implement` Fase 7), que trunca o arquivo. **Não tocar manualmente.**
- Alerta quando `docs/sessions/*.md` passa de 800 linhas (checkpoint não é diário append-only).
- Alerta quando `pocketbase/pb_migrations/` é editado e `/audit-sync` não roda há 24h (stamp `.opencode/.audit-sync-stamp`).

---

<!-- BEGIN:AGENT-MEMORY -->
## 🧠 Memória Persistente dos Agentes

> Bloco gerado por `agent-memory/scripts/inject.py`. **Não edite à mão** — as
> alterações vão em `~/projects/agent-memory` e são reinjetadas de lá.

Repositório de memória: `~/projects/agent-memory`
Antes de qualquer tarefa neste projeto, este brief já está carregado. Para o
detalhe completo use a skill `agent-memory` ou os comandos abaixo.

```bash
python3 ~/projects/agent-memory/scripts/memory.py code "<arquivo-que-vou-editar>"
python3 ~/projects/agent-memory/scripts/memory.py symptom "<mensagem-de-erro>"
python3 ~/projects/agent-memory/scripts/memory.py load svelte-app-clean-arch
```

> ⚙️ Gerado por `scripts/brief.py` — **não edite à mão**. Carregado em toda sessão. Detalhe completo: `memory.py code <arquivo>` / `memory.py symptom "<erro>"`.

### 🏛️ Constituição (MUST) — v1.0.0 (14)

- **P-001** Domínio puro, mutação por form action `PRJ-SVK-005`
- **P-002** App ativo é `runes` `PRJ-SVK-005`
- **P-003** TDD não-negociável `PRJ-SVK-005`
- **P-004** Toda entrada é validada por schema `PRJ-SVK-005`
- **P-005** Autorização no banco, por posse e por campo `PRJ-SVK-005`
- **P-006** Schema versionado e datado `PRJ-SVK-005`
- **P-007** Sem diálogo nativo do navegador `PRJ-SVK-005`
- **P-008** `throw redirect()` nunca dentro de `try-catch` `PRJ-SVK-005`
- _… +6 em PRJ-SVK-005 — `projetos/svelte-app-clean-arch/constituicao.md` para o texto completo._

> Violação de princípio MUST é achado CRITICAL: bloqueia plan, analyze e convergência.

### 🚫 Proibições técnicas (18)

- NUNCA colocar `throw redirect()` dentro de um bloco `try-catch` genérico `REG-FE-002`
- NUNCA usar `fetch(window.location.href, { body: { action: '...' } })` para Form Actions `REG-FE-002`
- NUNCA fazer `res.json()` ao chamar uma Form Action via `fetch` `REG-FE-002`
- NUNCA inicializar conexões realtime apenas no `onMount` sem `$effect` para sincronização `REG-FE-002`
- NUNCA autenticar o realtime com `pb.authStore.save(token, null)` `REG-FE-002`
- NUNCA mutar uma lista vinda de `data.*` via `fetch` sem invalidar `REG-FE-002`
- NUNCA criar entidade com lista de participantes sem incluir o criador `REG-FE-002`
- NUNCA divergir o nome do campo entre form, schema Zod e `formData.get` `REG-FE-002`
- NUNCA usar `window.alert()` ou `window.prompt()` `REG-FE-001`
- NUNCA usar classes do Tailwind fora do intervalo padrão (ex: `grid-cols-13`) `REG-FE-001`
- _… +8 em REG-FE-001, REG-FE-003 — `memory.py search <ID>` para o texto completo._

### 📋 Regras de negócio (13)

- RN-KB-01: Todo novo projeto criado inicia automaticamente com três colunas: `Aguardando` (`type… `REG-NEG-004`
- RN-KB-02: O usuário que cria um projeto é automaticamente adicionado à lista de participantes e… `REG-NEG-004`
- RN-KB-03: Ao abrir o formulário de criação de sprint, o nome padrão deve vir pré-preenchido como… `REG-NEG-004`
- RN-KB-04: Um projeto pode ter no máximo uma Sprint em estado `Em Andamento` (Active) por vez. `REG-NEG-004`
- RN-KB-05: Apenas membros participantes do projeto podem criar, mover ou comentar em cartões… `REG-NEG-004`
- RN-PP-01: O baralho utiliza a escala de Fibonacci padrão: `0`, `1`, `2`, `3`, `5`, `8`, `13`… `REG-NEG-003`
- RN-PP-02: Durante a fase ativa de votação, os participantes podem alterar seus votos a qualquer… `REG-NEG-003`
- RN-PP-03: Apenas o criador/facilitador da sala de poker tem permissão para acionar as ações… `REG-NEG-003`
- _… +5 em REG-NEG-003, REG-NEG-005 — `memory.py search <ID>` para o texto completo._

### ⚠️ Débitos abertos

- **baixa** — Migração em Massa de Registros Legados de HTML para Markdown `DEB-TEC-001`
- **media** — Resolução de Módulos $env do SvelteKit no Runner do Playwright E2E `DEB-TEC-002`
- **media** — API Rules Excessivamente Permissivas na Coleção Sprints `DEB-TEC-003`

### 🔥 Já quebrou aqui antes

- Falha Silenciosa em expand com viewRule Restritiva no PocketBase `ERR-FE-003`
- PocketBase fields.add() Requer Instância de Tipo de Campo, Não Plain Object `ERR-FE-001`
- throw redirect() do SvelteKit Silenciosamente Engolido Dentro de try-catch `ERR-FE-002`
- Uso de Classe Inexistente no Tailwind (md:grid-cols-13) `ERR-FE-004`

### 🏛️ Decisões vigentes

- Orquestração de modelos por carga cognitiva com fallback funcional `DEC-TEC-005`
- Pipeline Spec-Driven em Artefatos Separados (spec/plan/tasks/checklist) com Convergência Obrigatória `DEC-TEC-009`
- Filtro de Stack no Roteamento Global da Memória, por Tecnologia Discriminante `DEC-TEC-010`
- Adoção do Svelte 5 com Runes e Arquitetura Ports & Adapters `DEC-TEC-001`
- Migração do Editor WYSIWYG Tiptap (HTML) para Milkdown / Markdown Puro `DEC-TEC-003`
- PocketBase Isolado em Docker com Migrations JS Versionadas `DEC-TEC-004`
> ✂️ truncado no orçamento de 4600 chars — use `memory.py load svelte-app-clean-arch`.

### 🧭 Antes de agir

0. Vou decidir/implementar → os MUST acima vêm antes de qualquer regra local
1. Vou editar um arquivo → `memory.py code <caminho>`
2. Recebi um erro → `memory.py symptom "<mensagem>"`
3. Vou decidir algo → checar `decisoes-tecnicas/` (protocolo `SKI-GER-001`)
4. Ao concluir → registrar com `evidence` + `source_refs`, depois `score.py` e `reindex.py`
<!-- END:AGENT-MEMORY -->
