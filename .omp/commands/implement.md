---
description: Ciclo completo de feature — spec-creator/spec-reviewer → builders (backend/frontend) → test-writer → code-reviewer → docs-writer. Pausa em cada fase. Uso: /implement <slug>
---
# /implement — Ciclo completo de feature (spec-driven)

Conduz o ciclo completo de uma feature no svelte-app, do spec ao commit-ready, seguindo o fluxo spec-driven (skill `spec-driven`). **Pause após cada fase** para o usuário aprovar antes da próxima.

## Argumentos

`$ARGUMENTS` — feature-slug em kebab-case (ex: `retro-poker-priorizacao`) ou caminho para spec existente em `docs/specs/`.

## Execução em fases

### Fase 1 — Spec (`spec-creator` + `spec-reviewer`)

1. Invocar `spec-creator` via task tool (`agent: "spec-creator"`):
   - Feature alvo: `$ARGUMENTS`.
   - Instruir: seguir a skill `spec-driven` — ler `docs/CODE-STRUCTURE.md`, as skills `pocketbase-collections` e `pocketbase-api-rules` (regras do banco), analisar segurança (XSS, realtime, IDOR) e gerar `docs/specs/<slug>.md` + `docs/workflow/<slug>.jira.md`.
2. Após a spec, invocar `spec-reviewer` via task tool (`agent: "spec-reviewer"`) para validar completude, consistência com Ports & Adapters e AC testáveis.
3. **PAUSE.** Apresente a spec validada + Jira. Aguarde aprovação ou refinamento.

### Fase 2 — Implementação (`backend` + `frontend`)

Após aprovação da spec:

1. Determinar escopo:
   - Só server/DB (PocketBase migrations, `+server.ts`, `+page.server.ts`, hooks) → agente `backend`.
   - Só client (componentes runes, rotas, domínio `$lib/domain`) → agente `frontend`.
   - Docker/CI/tooling/build config → agente `infra`.
   - Refatoração de código existente (sem mudança de comportamento) → agente `refactorer`.
   - Bug com causa não óbvia → agente `debugger` (reproduz → isola → corrige → verifica).
   - Ambos → invocar **em paralelo** (single message com múltiplas task calls).
2. Cada builder segue o padrão **runes Ports & Adapters** (skill `runes-ports-adapters`): domínio `$lib/domain/*.svelte.ts` reativo, service, `TodoGateway` de `packages/todo-domain`, UI presentacional + container, testes com `TodoMemoryGateway`.
3. Builders respeitam: idioma (código EN, dados/erros PT), `data-testid` em componentes, imports de ícones por sub-path (`lucide-svelte/icons/*`), form actions com `deserialize` + headers corretos, `novalidate` em forms.
4. **PAUSE** após builders concluírem. Apresente `git diff` + `git status --short`.

### Fase 3 — Testes (`test-writer`)

1. Invocar `test-writer` via task tool (`agent: "test-writer"`):
   - Cria/atualiza testes unitários (Vitest) e e2e (Playwright) para o que foi implementado.
   - Padrões: funções puras, classes reativas `.svelte.ts`, schemas Zod, `data-testid` + `getByTestId`, fixtures/cleanup/env do e2e.
   - Para volume grande de specs e2e, invocar também `e2e-writer` (`agent: "e2e-writer"`) em paralelo — foco exclusivo em Playwright.
2. Rodar gates:
   ```bash
   npm run check          # typecheck de todos os apps/pacotes (fallback: npm run check:domain)
   npm run test           # testes unitários
   npm run test:coverage  # cobertura (se aplicável)
   npm run test:e2e       # Playwright chromium (se mudanças no client)
   ```
3. **PAUSE** se houver falhas. Corrigir via Fase 2 (escopo cirúrgico) e re-rodar.

### Fase 4 — Review (`code-reviewer`)

1. Invocar `code-reviewer` via task tool (`agent: "code-reviewer"`):
   - Revisa o diff contra: `AGENTS.md`, skills (`runes-ports-adapters`, `pocketbase-api-rules`, `pocketbase-collections`, `error-handling`, `client-realtime-and-actions`, `data-testid`, `icon-library-imports`), `docs/CODE-STRUCTURE.md`.
   - Read-only — nunca aplica fix.
2. Reporta achados (🔴 blockers / 🟠 ressalvas / 🟡 nits / ✅ praises).
3. **PAUSE** se houver blockers. Aguarde aprovação de fix.

### Fase 5 — Docs (`docs-writer`) — ANTES do commit

Após review aprovado (sem blockers):

1. Invocar `docs-writer` via task tool (`agent: "docs-writer"`):
   - Lê `.omp/.session-changes.log` + `git diff` + a spec.
   - Cria `docs/features/<slug>.md` (template `docs/features/_template.md`).
   - Atualiza `docs/CHANGELOG.md` (entrada no topo com data ISO).
   - Atualiza `docs/CODE-STRUCTURE.md` (novos arquivos/pastas) e `docs/ROUTES.md` (rotas novas/alteradas).
   - Move débito identificado e não corrigido para `docs/TECH-DEBT.md`; problema resolvido não trivial para `docs/LESSONS-LEARNED.md`.
   - Atualiza índices (`docs/features/README.md`, `docs/specs/README.md`, `docs/workflow/README.md`).
   - Gera `docs/workflow/<slug>.pr.md` (template `docs/workflow/_template-pr.md`) e sugere `gh pr create --body-file ...` — **não executa**.
   - **Trunca** `.omp/.session-changes.log`.
3. Validação: rodar `npm run check` de novo se docs tocavam código.

### Fase 6 — Commit final (manual pelo usuário)

Apresente:
- Resumo do que foi feito (técnico + impacto em produto).
- Diff completo (`git diff` + `git status --short`).
- Mensagem sugerida no formato Conventional Commits (`<tipo>(<escopo>): [CODIGO-JIRA] <descrição>`).
- **Sem `Co-Authored-By`** ou footer "Generated with ...".

**O usuário decide commit/push.** Você nunca commita sozinho.

## Output esperado em cada fase

```
📋 Fase 1/6 — Spec
[output do spec-creator + veredito do spec-reviewer — links para docs/specs/<slug>.md]
⏸️  Pausando para aprovação. Próxima: Implementação.

🔧 Fase 2/6 — Implementação
[diff curto + status; menção aos builders invocados em paralelo]
⏸️  Pausando para revisão. Próxima: Testes.

🧪 Fase 3/6 — Testes
[resultado dos gates: check, test, coverage, e2e]
⏸️  Pausando se houver falhas. Caso contrário, próxima: Review.

🔍 Fase 4/6 — Review
[output do code-reviewer; status APROVADO / RESSALVAS / BLOQUEADO]
⏸️  Pausando se houver blockers. Caso contrário, próxima: Docs.

🗂️  Fase 5/6 — Docs (antes do commit)
[output do docs-writer — docs criados/atualizados]

✅ Fase 6/6 — Pronto para commit
[mensagem de commit sugerida; usuário decide]
```

## Notas

- Bugfix trivial (< 30min, escopo único) pode pular Fase 1 (spec) e Fase 3 (testes dedicados) — ir direto para Fase 2 com instruções inline. Mas **sempre** passa por Fase 4 (review) e Fase 5 (docs).
- Se surgir bloqueador inesperado durante Fase 2, o builder deve **parar e reportar** — não improvisar arquitetura.
- `/checkpoint` standalone só é usado quando há mudanças manuais fora do ciclo `/implement` (Fase 5 já chama `docs-writer`).
- Nova coleção PocketBase exige `created`/`updated` + API Rules estritas (skills `pocketbase-*`); migrations em `pocketbase/pb_migrations/` são área sensível — o hook alerta se `/audit-sync` não rodou há 24h.
