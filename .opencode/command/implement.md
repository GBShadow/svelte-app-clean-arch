---
description: Ciclo completo de feature em 7 fases — spec-creator/spec-reviewer/spec-converge → frontend/backend/test-writer → docs-writer. Pausa e gate explícito em cada fase. Uso: /implement <slug>
agent: build
---

# /implement — Ciclo completo de feature (spec-driven, 7 fases)

Conduz o ciclo completo de uma feature no svelte-app, do spec ao commit-ready, seguindo o fluxo spec-driven (`.agents/skills/spec-driven.md` / `.opencode/skills/spec-driven/SKILL.md`). **Pause e gate explícito ao fim de cada fase** — o ciclo só avança quando o gate da fase passa. `gh pr create` é **sugerido**, nunca executado (R13); commit/push é sempre decisão do usuário.

## Argumentos

`$ARGUMENTS` — feature-slug em kebab-case (ex: `retro-poker-priorizacao`) ou caminho para spec existente em `docs/specs/`.

## Resumo do pipeline (7 fases)

| Fase | Dono | Artefato(s) | Gate de saída |
| --- | --- | --- | --- |
| 1 Spec + Esclarecimentos | `spec-creator` | `docs/specs/<slug>.md` | ≤3 `[PRECISA ESCLARECER]` abertos |
| 2 Checklist | `spec-reviewer` (checklist) | `docs/specs/<slug>.checklist.md` | itens `CHK###` marcados pelo usuário |
| 3 Plan + Tasks | `spec-creator` | `docs/specs/<slug>.plan.md` + `.tasks.md` + `.jira.md` | Constitution Check sem violação injustificada; toda `RF-###` coberta |
| 4 Analyze | `spec-reviewer` (analyze) | relatório em tela (read-only) | nenhum achado `CRITICAL` |
| 5 Implementação | `frontend`/`backend`/`test-writer` | código, TDD | todas as tasks `[X]` + `pnpm test` verde |
| 6 Convergência | `spec-converge` | append em `.tasks.md` | `✅ Convergido` |
| 7 Documentação | `docs-writer` | feature doc + CHANGELOG + PR | — |

## Execução em fases

### Fase 1 — Spec + Esclarecimentos (`spec-creator`)

1. Invocar `spec-creator` via Task tool (`subagent_type: "spec-creator"`):
   - Seguir `.opencode/skills/spec-driven/SKILL.md` — ler `docs/CODE-STRUCTURE.md`, as skills `pocketbase-collections` e `pocketbase-api-rules` (regras do banco) e analisar segurança (XSS, realtime, IDOR).
   - Gerar `docs/specs/<slug>.md` descrevendo o **QUÊ** e o **PORQUÊ** — **sem stack** (R1): proibido nome de framework, biblioteca, arquivo, rota, coleção, campo de banco ou componente. Tudo isso vive no `.plan.md`. Única exceção: sistema externo já em produção quando o requisito é de compatibilidade.
   - Ambiguidades: marcar `[PRECISA ESCLARECER: pergunta]`, **máximo 3 por spec** (R2). Se existe default óbvio da indústria/projeto, assumir e registrar em `## Premissas` em vez de perguntar. Mais de 3 marcadores = feature grande demais → usar `.roadmap.md`.
2. Esclarecimentos (R3), se houver marcadores: perguntar **exatamente uma por vez** (cota de 5/sessão, nunca antecipando a próxima). Cada pergunta traz "Por que importa" + 2 a 5 opções. Após cada resposta: gravar `- Q: … → A: …` em `## Esclarecimentos` / `### Sessão AAAA-MM-DD`, atualizar a seção temática correspondente e **salvar o arquivo antes da próxima pergunta**. O que sobrar da cota vira `Deferred:`.
3. **Gate de esclarecimento:** no máximo 3 marcadores `[PRECISA ESCLARECER]` abertos.
4. **PAUSE.** Apresente a spec + esclarecimentos. Aguarde aprovação ou refinamento.

### Fase 2 — Checklist (`spec-reviewer` modo checklist)

1. Invocar `spec-reviewer` via Task tool (`subagent_type: "spec-reviewer"`, modo checklist):
   - Gera `docs/specs/<slug>.checklist.md` com itens `CHK###` **interrogativos sobre a REDAÇÃO do requisito**, não sobre o software (R6). Proibidos os verbos "Verificar", "Testar", "Confirmar", "clicar", "funciona corretamente".
2. **Gate de checklist (R6):** antes de implementar, o comando **lê** `<slug>.checklist.md` e **conta itens marcados vs. não marcados**. Se houver item **não marcado**, **PARAR e pedir confirmação do usuário**. O agente **nunca marca `[x]`** e **não altera marcadores** — a marcação é do humano; quem implementa lê o checklist como gate e não mexe nos marcadores.
3. **PAUSE.** Aguarde o usuário marcar os itens pendentes.

### Fase 3 — Plan + Tasks (`spec-creator`)

1. Invocar `spec-creator` via Task tool (`subagent_type: "spec-creator"`):
   - Gerar `docs/specs/<slug>.plan.md` (o **COMO**): stack, arquivos, rotas, coleções, campos, componentes — tudo que a spec proíbe vive aqui.
   - **Constitution Check** obrigatório: qualquer violação injustificada da constituição **bloqueia** a fase.
   - Gerar `docs/specs/<slug>.tasks.md` (R4/R5): IDs estáveis de largura fixa (`RF-###`, `RNF-###`, `AC-###`, `SC-###`, `T###`, `US#`) nunca renumerados nem reciclados; toda `RF-###` coberta por ≥1 `T###`. Formato: `- [ ] T001 [P] [US1] Descrição com caminho exato do arquivo` — `[P]` **somente** se arquivos disjuntos e sem dependência pendente. Fases: `Fase 1: Setup` → `Fase 2: Fundação` (BLOQUEIA todas as user stories) → `Fase 3..N`: uma por user story em ordem `P1..Pn`, cada uma terminando em `**Checkpoint**` → `Fase final: Polimento`.
   - Gerar `docs/workflow/<slug>.jira.md` (**derivado** de `.tasks.md`).
2. **Gate de rastreabilidade:** toda `RF-###` coberta por ≥1 `T###`.
3. **PAUSE.** Apresente plan + Constitution Check + tasks + Jira derivado. Aguarde aprovação.

### Fase 4 — Analyze (`spec-reviewer` modo analyze)

1. Invocar `spec-reviewer` via Task tool (`subagent_type: "spec-reviewer"`, modo analyze, **read-only**):
   - Relatório em tela. Severidade objetiva (R7): `CRITICAL` = viola princípio MUST da constituição OU requisito com zero cobertura em `.tasks.md`; `ALTA` = requisito duplicado/conflitante ou critério de aceite não testável; `MÉDIA` = drift de terminologia, caso de borda vago; `BAIXA` = estilo. Teto de 50 achados. A correção é sempre feita no artefato dono.
2. **Gate de analyze:** nenhum achado `CRITICAL`. Se houver, voltar ao artefato dono (Fase 1 ou 3) e corrigir antes de seguir.
3. **PAUSE.** Aguarde aprovação do relatório.

### Fase 5 — Implementação (`frontend`/`backend`/`test-writer`)

1. Determinar escopo:
   - Só server/DB (PocketBase migrations, `+server.ts`, `+page.server.ts`, hooks) → agente `backend`.
   - Só client (componentes runes, rotas, domínio `$lib/domain`) → agente `frontend`.
   - Ambos → invocar **em paralelo** (single message com múltiplas Task calls).
2. Respeitar **R5**:
   - A fase **Fundação** bloqueia todas as user stories.
   - Tasks `[P]` (arquivos disjuntos, sem dependência pendente) podem ir em paralelo; tasks no mesmo arquivo são **serializadas**.
   - Marcar `- [X]` em `<slug>.tasks.md` **imediatamente** após cada task concluída.
   - **Falha em task sequencial interrompe o ciclo**; falha em task `[P]` deixa as demais seguirem e é **reportada**.
3. **TDD é MUST (R12):** nenhuma linha de produção sem o teste que a exige (Red-Green-Refactor); permanece como `RNF-TDD` na spec.
4. Padrão real de implementação: form actions em `+page.server.ts` chamando `locals.pb`; domínio puro em `apps/runes/src/lib/domain/`; classe reativa `.svelte.ts` para realtime; Zod em `$lib/validation/`; tipos em `$lib/server/*Record.ts`.
5. **Gate:** todas as tasks `[X]` e `pnpm test` verde.
6. **PAUSE.** Apresente `git diff` + `git status --short` + tasks marcadas.

### Fase 6 — Convergência (`spec-converge`)

1. Invocar `spec-converge` via Task tool (`subagent_type: "spec-converge"`):
   - **Append-only (R8):** nunca edita nem apaga código; nunca reescreve tasks existentes. Classifica cada achado em `ausente | parcial | contradiz | não-solicitado`. Violação de constituição é emitida primeiro e sempre como `CRITICAL`. Próximo id = `T{M+1:03d}`. Anexa os achados em nova seção `## Fase N: Convergência` de `docs/specs/<slug>.tasks.md`.
2. **Gate de convergência:** saída `✅ Convergido` + `pnpm test` verde. Se a saída for `↻ N tarefas anexadas`, **voltar para a Fase 5** e implementar as novas tasks.
3. **PAUSE.** Feature só é declarada pronta com `✅ Convergido` + `pnpm test` verde.

### Fase 7 — Documentação (`docs-writer`)

1. Invocar `docs-writer` via Task tool (`subagent_type: "docs-writer"`):
   - Cria `docs/features/<slug>.md` (template `docs/features/_template.md`).
   - Atualiza `docs/CHANGELOG.md` (entrada no topo com data ISO).
   - Gera `docs/workflow/<slug>.pr.md` (template `docs/workflow/_template-pr.md`) e **sugere** `gh pr create --body-file docs/workflow/<slug>.pr.md` — **nunca executa** (R13).
   - Atualiza índices (`docs/features/README.md`, `docs/specs/README.md`, `docs/workflow/README.md`) e `docs/CODE-STRUCTURE.md`/`docs/ROUTES.md` conforme mudanças.
2. **PAUSE.** Apresente os docs criados + o comando de PR sugerido (sem executar).

## Output esperado em cada fase

```
📋 Fase 1/7 — Spec + Esclarecimentos
[spec + esclarecimentos; gate: ≤3 [PRECISA ESCLARECER]]
⏸️  Gate de esclarecimento OK. Pausando para aprovação. Próxima: Checklist.

✅ Fase 2/7 — Checklist
[checklist CHK###; gate: itens marcados? se não — PARAR e pedir confirmação]
⏸️  Pausando para o usuário marcar os itens. Próxima: Plan + Tasks.

📐 Fase 3/7 — Plan + Tasks
[plan com Constitution Check; tasks com rastreabilidade RF→T; Jira derivado]
⏸️  Pausando para aprovação. Próxima: Analyze.

🔍 Fase 4/7 — Analyze
[relatório read-only; gate: 0 CRITICAL]
⏸️  Pausando para aprovação. Próxima: Implementação.

🔧 Fase 5/7 — Implementação
[TDD; tasks [X] marcadas; gate: pnpm test verde]
⏸️  Pausando para revisão. Próxima: Convergência.

🔁 Fase 6/7 — Convergência
[✅ Convergido | ↻ N tarefas anexadas → volta à Fase 5]
⏸️  Pausando. Feature pronta apenas com ✅ Convergido + pnpm test verde.

📚 Fase 7/7 — Documentação
[feature doc + CHANGELOG + PR sugerido (não executado)]
```

## Notas

- Bugfix trivial (< 30min, escopo único) pode pular a spec (Fase 1), mas **sempre** passa pelos gates de checklist, analyze, convergência e docs. Fluxo de bug com causa investigável segue `bug-assess` → `frontend`/`backend` → `test-writer`, não este ciclo.
- Se surgir bloqueador inesperado durante a Fase 5, o builder deve **parar e reportar** — não improvisar arquitetura.
- `gh pr create` é **sugerido**, nunca executado (R13). Sem trailer `Co-Authored-By`. O usuário decide commit/push.
- Nova coleção PocketBase exige `created`/`updated` + API Rules estritas (skills `pocketbase-*`); migrations em `pocketbase/pb_migrations/` são área sensível — o plugin alerta se `/audit-sync` não rodou há 24h.
