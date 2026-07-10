# Plano de Correção — Testes E2E (Playwright)

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Task |
| Priority | High |
| Labels | sveltekit, runes, e2e, playwright, test-fix |
| Story Points | 5 |
| Jira Key | [JIRA-KEY] |
| Epic | Qualidade de Testes |

## Description

### Contexto

Atualmente 8 dos 9 testes e2e do app `runes` estão falhando com timeout de 30s. As causas raiz são:

1. **Preview server não inicia** — `ERR_MODULE_NOT_FOUND` ao carregar `manifest.js` quando o
   Playwright executa `pnpm run build && pnpm run preview` internamente.

2. **Teste de change-password corrompe o seed** — O teste altera a senha do admin seed
   (`changeme123456`). Se falha no meio do fluxo, a senha fica alterada e todos os outros testes
   (que dependem do login seed) quebram.

3. **Auth token invalidado pós-troca de senha** — O PocketBase invalida o token após
   `auth.update()` com nova senha. O hooks.server.ts redireciona para `/login`, mas o teste
   esperava navegação para `/todos`.

4. **Falta de isolamento** — Dados não são limpos entre execuções de teste.

### Objetivo

Corrigir todos os 8 testes falhos, garantir que o build + preview funcione via script na raiz,
isolar o seed admin dos testes (criar usuário temporário para change-password), e adicionar
cleanup de dados entre execuções.

### Escopo

**Incluído:**
- Criar script `test:e2e` no `package.json` raiz (build + preview + tests)
- Atualizar `playwright.config.ts` para `reuseExistingServer: true`
- Refatorar `change-password.spec.ts`: usar usuário temporário + re-login manual
- Adicionar cleanup de dados (beforeEach ou afterAll)
- Atualizar índice do workflow

**Fora do escopo:**
- Adicionar novos testes e2e
- Modificar testes de unidade
- Alterar lógica de negócio dos componentes
- Modificar backend PocketBase (migrations, seed)
- Modificar hooks.server.ts ou server actions

## Acceptance Criteria

- [ ] AC1: `pnpm test:e2e` na raiz faz build + preview + testes sem erro de módulo
- [ ] AC2: O teste de change-password cria usuário temporário, troca senha e faz re-login
- [ ] AC3: Após troca de senha, o teste espera redirect para `/login` (não `/todos`)
- [ ] AC4: Dados temporários são limpos ao final de cada teste
- [ ] AC5: Executar os testes duas vezes seguidas funciona (idempotente)
- [ ] AC6: O seed admin nunca é alterado pelos testes
- [ ] AC7: 9/9 testes passam em todas as execuções
- [ ] AC8: Testes rodam em menos de 30s cada

## Technical Notes

| Camada | Ação | Arquivos |
|--------|------|----------|
| Config | Script raiz + Playwright config | `package.json` (raiz), `playwright.config.ts` |
| Testes | Refatorar change-password + cleanup | `change-password.spec.ts`, `fixtures.ts` |
| Infra | Build separado antes dos testes | Script `test:e2e` no `package.json` raiz |

## Plano de implementação

1. Atualizar `playwright.config.ts` — `reuseExistingServer: true`
2. Criar script `test:e2e` no `package.json` raiz (build + test)
3. Refatorar `change-password.spec.ts` — criar usuário temporário via login admin + UI
4. Adicionar `afterAll` nos specs CRUD para cleanup de dados
5. Validar: `pnpm test:e2e` passa com 9/9 testes

## Links

- Spec: `docs/specs/e2e-test-fix-plan.md`
- Spec data-testid: `docs/specs/data-testid-e2e.md`
- Feature doc: `docs/features/e2e-test-fix-plan.md`
- PR (após implementação): `docs/workflow/e2e-test-fix-plan.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

- [ ] Config — script raiz + playwright.config.ts
- [ ] Testes — change-password com usuário temporário
- [ ] Cleanup — afterAll nos specs CRUD
- [ ] Validação — rodar `pnpm test:e2e` e confirmar 9/9
