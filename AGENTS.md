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

- `implement <slug>` — ciclo completo spec-driven: spec-creator/spec-reviewer → builders (backend/frontend) → test-writer → code-reviewer → docs-writer, com pausa em cada fase. Definição em `.opencode/command/implement.md`.
- `checkpoint` — salva estado da sessão em `docs/sessions/` e sincroniza docs versionados (CHANGELOG, CODE-STRUCTURE, ROUTES, TECH-DEBT, LESSONS-LEARNED, features) via docs-writer, antes de /clear ou commit. Definição em `.opencode/command/checkpoint.md`.
- `audit-sync` — auditoria de drift entre código e docs (ROUTES, CODE-STRUCTURE, CHANGELOG, TECH-DEBT, specs/features). Toca o stamp `.opencode/.audit-sync-stamp` (lido pelo plugin). Definição em `.opencode/command/audit-sync.md`.
- `review` — revisão completa de código: análise técnica, lint/typecheck, testes,
  documentação (CODE-STRUCTURE, CHANGELOG, features, tech-debt), lições aprendidas e
  análise de impacto. Aceita commit, branch, PR ou nada (mudanças não commitadas).
  Definição em `.opencode/command/review.md`.

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
- `commit-and-pr-docs` — atualizar toda documentação ao criar commits e PRs
- `context7-mcp` — busca de docs de bibliotecas via Context7

## Plugin de sessão (`.opencode/plugin/session-changes.ts`)

- Edits/Writes em `apps/` e `packages/` são registrados em `.opencode/.session-changes.log` (gitignored) — consumido pelo `docs-writer` (`/checkpoint`, `/implement` Fase 5), que trunca o arquivo. **Não tocar manualmente.**
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

Gerado por `scripts/brief.py`. Carregado em toda sessão. Detalhe completo: `memory.py code <arquivo>` / `memory.py symptom "<erro>"`.

### 🚫 Proibições técnicas (27)

- NUNCA publicar `@ApiOperation` sem o campo `description` ou apenas com `summary` raso `REG-DOC-001`
- NUNCA omitir respostas de erro em `@ApiResponse` cobrindo apenas status 200/201 `REG-DOC-001`
- NUNCA usar exemplos genéricos ou fictícios como `example: "string"` ou `example: 0` `REG-DOC-001`
- NUNCA deixar DTOs de entrada ou saída sem decorators de propriedade `REG-DOC-001`
- NUNCA esconder peculiaridades de parâmetros de rota `REG-DOC-001`
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
- NUNCA criar placeholders de avatar inline sem centralização explícita `REG-FE-001`
- _… +11 em REG-FE-001, REG-FE-003, REG-SEC-002 — `memory.py search <ID>` para o texto completo._

### 📋 Regras de negócio (13)

- RN-KB-01: Todo novo projeto criado inicia automaticamente com três colunas: `Aguardando` (`type… `REG-NEG-004`
- RN-KB-02: O usuário que cria um projeto é automaticamente adicionado à lista de participantes e… `REG-NEG-004`
- RN-KB-03: Ao abrir o formulário de criação de sprint, o nome padrão deve vir pré-preenchido como… `REG-NEG-004`
- RN-KB-04: Um projeto pode ter no máximo uma Sprint em estado `Em Andamento` (Active) por vez. `REG-NEG-004`
- RN-KB-05: Apenas membros participantes do projeto podem criar, mover ou comentar em cartões… `REG-NEG-004`
- RN-PP-01: O baralho utiliza a escala de Fibonacci padrão: `0`, `1`, `2`, `3`, `5`, `8`, `13`… `REG-NEG-003`
- RN-PP-02: Durante a fase ativa de votação, os participantes podem alterar seus votos a qualquer… `REG-NEG-003`
- RN-PP-03: Apenas o criador/facilitador da sala de poker tem permissão para acionar as ações… `REG-NEG-003`
- RN-PP-04: Na revelação, o sistema calcula a média aritmética dos votos numéricos e destaca a… `REG-NEG-003`
- RN-RT-01: Todo card criado em uma retrospectiva é anônimo na visualização de todos os membros da… `REG-NEG-005`
- RN-RT-02: Apenas o navegador que criou o card recebe o `editToken` (SHA-256) que permite editar… `REG-NEG-005`
- RN-RT-03: Uma nova retrospectiva é inicializada com 3 colunas marcadas `is_default`: `O que foi… `REG-NEG-005`
- _… +1 em REG-NEG-005 — `memory.py search <ID>` para o texto completo._

### ⚠️ Débitos abertos

- **baixa** — Migração em Massa de Registros Legados de HTML para Markdown `DEB-TEC-001`
- **media** — Resolução de Módulos $env do SvelteKit no Runner do Playwright E2E `DEB-TEC-002`
- **media** — API Rules Excessivamente Permissivas na Coleção Sprints `DEB-TEC-003`

### 🔥 Já quebrou aqui antes

- Falha Silenciosa em expand com viewRule Restritiva no PocketBase `ERR-FE-003`
- PocketBase fields.add() Requer Instância de Tipo de Campo, Não Plain Object `ERR-FE-001`
- throw redirect() do SvelteKit Silenciosamente Engolido Dentro de try-catch `ERR-FE-002`
- Uso de Classe Inexistente no Tailwind (md:grid-cols-13) `ERR-FE-004`

### ♻️ Já resolvido em outro projeto (aplica-se aqui)

- Aprendizado: Isolamento e Determinismo em Testes Unitários — origem `null` `APR-GER-002`
- Aprendizado: Padronização de Exceções de Domínio e Respostas de Erro HTTP — origem `null` `APR-GER-001`

> Padrão agnóstico de stack. Antes de aplicar, confira a equivalência em `index-por-sintoma.md` (seção ♻️). Busca: `memory.py solve "<problema>"`.

### 🏛️ Decisões vigentes

- Orquestração de modelos por carga cognitiva com fallback funcional `DEC-TEC-005`
- Adoção do Svelte 5 com Runes e Arquitetura Ports & Adapters `DEC-TEC-001`
- Migração do Editor WYSIWYG Tiptap (HTML) para Milkdown / Markdown Puro `DEC-TEC-003`
- PocketBase Isolado em Docker com Migrations JS Versionadas `DEC-TEC-004`

> ✂️ truncado no orçamento de 4600 chars — use `memory.py load svelte-app-clean-arch`.
<!-- END:AGENT-MEMORY -->
