# fix(e2e): corrige a suíte Playwright e fecha bypass de troca de senha

Created: 2026-07-10


> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Os 10 testes e2e do app `runes` falhavam em massa porque o teste antigo de troca de senha
envenenava o admin seed. A entrega corrige a suíte (10/10, idempotente), torna o ambiente de teste
determinístico e endurece pontos de segurança descobertos no processo — incluindo uma vulnerabilidade
real: a troca de senha não exigia a senha atual para contas admin.

## Tipo de mudança

- [ ] Nova funcionalidade
- [x] Correção de bug
- [ ] Refatoração
- [x] Documentação
- [x] Chore / tooling

## Alterações

### App(s)
- `apps/runes/src/routes/change-password/+page.server.ts` — reautentica com a senha atual antes de
  aplicar a troca (fecha o bypass do `manageRule`).
- `apps/runes/playwright.config.ts` — `webServer` passa a `build && preview` (o dev server deixava a
  hidratação instável e submetia forms vazios).
- Componentes/rotas `.svelte` — `data-testid` para os seletores dos testes.
- `package.json` (raiz) — `test:e2e` builda antes de rodar o Playwright.

### Infra
- `pocketbase/docker-entrypoint.sh` / `docker-compose.yml` — recusa subir com a senha de exemplo
  (`changeme123456`); dev local libera via `ALLOW_INSECURE_ADMIN_PASSWORD=true`.

### Testes
- `e2e/env.ts` (novo) — constantes do seed + guard fail-fast (`assertSeedAdmin`).
- `e2e/cleanup.ts` (novo) — limpeza via API PocketBase: limpa `user`+`auth`, filtro parametrizado,
  falhas ruidosas.
- `e2e/fixtures.ts` — guard antes do login pela UI.
- `change-password.spec.ts` — usuário temporário; o teste de senha incorreta usa usuário não-admin.
- `todo-sharing.spec.ts` → `todo-crud-basico.spec.ts` (nome refletia mal a cobertura).
- Ajustes de testid em validações (`error-title`, `error-current-password`).

## Test plan

- [x] `pnpm test` — 38 testes unitários passam
- [x] `pnpm check` — 0 erros
- [x] `pnpm test:e2e` — 10/10, rodado 2× sem reset (idempotente), sem resíduo no banco
- [x] Guard verificado: com seed divergente, falha em ~0,5s com mensagem clara

## Documentação

- Spec: [docs/specs/2026-07-10-e2e-test-fix-plan.md](../specs/2026-07-10-e2e-test-fix-plan.md)
- Feature: [docs/features/2026-07-10-e2e-test-fix-plan.md](../features/2026-07-10-e2e-test-fix-plan.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

Nenhuma no app. Operacional: um deploy do PocketBase que ainda use a senha de exemplo deixa de subir
até definir uma senha real (ou `ALLOW_INSECURE_ADMIN_PASSWORD=true` em dev).

## Achados de segurança ainda abertos (fora deste PR — decisão de produto)

- **Compartilhamento amplo:** `public = true` torna a lista legível por qualquer usuário autenticado.
- **Gate de troca de senha:** o reset grava `passwordSetAt = now`, dando 10 dias de janela para a
  senha temporária conhecida pelo admin.

## Issues / Jira

- Jira: [docs/workflow/2026-07-10-e2e-test-fix-plan.jira.md](./2026-07-10-e2e-test-fix-plan.jira.md)
