---
description: Detecta drift entre código e docs — varre rotas, estrutura, features/specs/workflow e débitos vs CHANGELOG/CODE-STRUCTURE/ROUTES/TECH-DEBT/LESSONS-LEARNED. Toca o stamp lido pelo plugin. Sem args.
agent: build
---

# /audit-sync — Auditoria de Drift

Comando de **manutenção**. Detecta descompassos entre o estado real do código e o que `docs/CODE-STRUCTURE.md`, `docs/ROUTES.md`, `docs/CHANGELOG.md`, `docs/features/`, `docs/specs/`, `docs/workflow/`, `docs/TECH-DEBT.md` e `docs/LESSONS-LEARNED.md` declaram. Útil quando a documentação ficou para trás (múltiplos commits sem `/checkpoint`).

## Sem argumentos

Comando autônomo. Não exige escopo — varre tudo.

## Execução

### 1. Estado base

```bash
git status --short
git log --oneline -20
```

### 2. Drift de ROUTES vs código

```bash
find apps -name "+*.ts" -not -path "*/node_modules/*" -not -path "*/.svelte-kit/*" -not -path "*/deprecated/*" | grep -E "\+page|route" | sort
```

Confrontar com `docs/ROUTES.md`:

- Rotas no código ausentes no doc (novos `+page.svelte`/`+server.ts`, `+page.server.ts`, form actions novas)
- Rotas no doc ausentes no código (removidas ou movidas para `deprecated/`)

### 3. Drift de CODE-STRUCTURE vs estrutura real

```bash
find apps packages -type f -not -path "*/node_modules/*" -not -path "*/.svelte-kit/*" | sed 's|/[^/]*$||' | sort -u | head -60
```

Confrontar com `docs/CODE-STRUCTURE.md`:

- Pastas novas (ex.: novo domínio em `apps/runes/src/lib/domain/`, novo módulo em `packages/`)
- Arquivos removidos que ainda aparecem no doc

### 4. Drift de CHANGELOG/features vs git log

```bash
git log --oneline --since="30 days ago"
```

- Commits que parecem feature concluída sem entrada em `docs/CHANGELOG.md` nem `docs/features/`
- Feature doc sem entrada no índice `docs/features/README.md`
- Spec sem Jira/PR correspondente em `docs/workflow/` (mesmo `<slug>`)

### 5. Drift de TECH-DEBT vs estado real

Para cada item aberto em `docs/TECH-DEBT.md`:

- Procurar evidência de resolução em `git log --grep=<termo-chave>`
- Se o débito cita arquivo/rota/coleção que não existe mais → sinalizar para mover a § Resolvidos
- Itens que deveriam ter virado entrada em `docs/LESSONS-LEARNED.md` (se a correção revelou causa raiz não trivial)

### 6. Drift de specs vs implementação

- `docs/specs/<slug>.md` sem feature doc correspondente (mesmo slug) e sem entrada em CHANGELOG
- Specs antigas (> 60 dias) sem feature doc → candidatas a arquivar ou fechar

### 7. Correções (opcional, com confirmação)

Se o drift for tratável mecanicamente (poucos itens, edits cirúrgicos), proponha invocar `docs-writer` para aplicar as correções. **Não invoque sem confirmação** — drift grande é sinal de housekeeping dedicado.

### 8. Staging final (obrigatório)

Após aplicar correções, `git add` nos arquivos tocados e apresente `git diff --staged --stat` + mensagem sugerida. **Não comite.** Aguarde feedback.

### 9. Tocar stamp (obrigatório)

Ao final, execute `touch .opencode/.audit-sync-stamp`. O plugin (`session-changes.ts`) lê esse stamp — se passar de 24h sem `/audit-sync` em sessão que edite `pocketbase/pb_migrations/`, a IA é alertada antes de prosseguir. Sem o `touch`, o aviso fica permanente.

## Output esperado

```markdown
## Audit sync — <YYYY-MM-DD>

### Drift de ROUTES
- 🟠 `apps/runes/src/routes/kanban/+page.svelte` ausente no docs/ROUTES.md
- 🟢 (resto OK)

### Drift de CODE-STRUCTURE
- 🟡 Pasta `apps/runes/src/lib/domain/retro/` ausente no doc

### Drift de CHANGELOG/features
- 🟠 Commit `<hash>` "<msg>" parece feature concluída sem CHANGELOG

### Drift de TECH-DEBT / LESSONS-LEARNED
- 🟢 sem pendências

### Drift de specs
- 🟡 `docs/specs/<slug>.md` sem feature doc (spec antiga)

### Ações sugeridas para docs-writer (aguardando confirmação)
- [ ] Adicionar rota em docs/ROUTES.md
- [ ] Entrada no CHANGELOG para o commit <hash>

### Ações que precisam de você (não automatizáveis)
- [ ] Decidir status da feature do commit <hash>
```

## Notas

- Esse comando **não muda código** — apenas docs (e só após confirmação)
- Bom rodar antes de release/tag, ou periodicamente (a cada ~2 sprints)
- O `/checkpoint` cobre o ciclo "edit → sync" da sessão atual; `/audit-sync` cobre o drift acumulado de ciclos passados onde o `/checkpoint` não rodou
