# Subagente spec-driven

Created: 2026-07-09


> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Adiciona um subagente do Claude Code (`.claude/agents/spec-driven.md`) que conduz o fluxo spec-driven do projeto (spec → Jira → implementação → feature doc → PR) de forma conversacional, gerando `docs/specs/<slug>.md` e `docs/workflow/<slug>.jira.md` a partir dos templates existentes, parando após essa etapa até o usuário confirmar que a implementação foi concluída.

## Tipo de mudança

- [x] Nova funcionalidade
- [ ] Correção de bug
- [ ] Refatoração
- [x] Documentação
- [ ] Chore / tooling

## Alterações

### Domínio
- Não aplicável — sem mudança em `packages/todo-domain`.

### App(s)
- Não aplicável — sem mudança em `apps/classic`, `apps/remote` ou `apps/runes`.

### Agente / Docs
- `.claude/agents/spec-driven.md` (novo)
- `docs/specs/2026-07-09-spec-driven-agent.md` (spec)
- `docs/workflow/2026-07-09-spec-driven-agent.jira.md` (Jira draft)
- `docs/features/2026-07-09-spec-driven-agent.md` (feature doc)
- `docs/CHANGELOG.md` (entrada)
- Índices atualizados: `docs/specs/README.md`, `docs/workflow/README.md`, `docs/features/README.md`
- Referências adicionadas: `CLAUDE.md`, `README.md`, `docs/README.md`

### Testes
- Validação manual do fluxo ponta a ponta (spec → Jira → pausa → confirmação → feature doc/CHANGELOG/PR), sem `TodoMemoryGateway` aplicável — não é código de domínio.

## Test plan

- [ ] `pnpm test` (não aplicável — sem código de produto)
- [ ] `pnpm check` (não aplicável — sem código de produto)
- [ ] `pnpm build` (não aplicável — sem código de produto)
- [x] Teste manual: ciclo completo desta própria feature (`spec-driven-agent`) usado como validação end-to-end do agente.

## Documentação

- Spec: [docs/specs/2026-07-09-spec-driven-agent.md](../specs/2026-07-09-spec-driven-agent.md)
- Feature: [docs/features/2026-07-09-spec-driven-agent.md](../features/2026-07-09-spec-driven-agent.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

Nenhuma.

## Issues / Jira

- Closes #[issue]
- Jira: [JIRA-KEY] — [docs/workflow/2026-07-09-spec-driven-agent.jira.md](./2026-07-09-spec-driven-agent.jira.md)

## Screenshots

_(não aplicável — sem UI)_
