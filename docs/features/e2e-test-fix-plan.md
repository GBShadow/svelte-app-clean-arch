# Plano de Correção — Testes E2E (Playwright)

## Resumo

Correção dos 8 testes e2e falhos do app `runes`. As causas raiz eram: preview server não iniciava
via Playwright, teste de change-password corrompia a senha do admin seed, auth token era invalidado
pós-troca de senha, e falta de isolamento entre testes.

## App(s) afetado(s)

runes (e2e)

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Config | `playwright.config.ts`, `package.json` (raiz) |
| Testes e2e | `change-password.spec.ts`, `fixtures.ts` |
| Testes e2e | `user-crud.spec.ts`, `todo-list-management.spec.ts`, `todo-sharing.spec.ts`, `auth-cross-tab.spec.ts` |

## Mudanças

### 1. Preview server — script separado na raiz

O `package.json` raiz agora tem um script `test:e2e` que:
1. Faz `build` do app runes
2. Executa `playwright test`

O `playwright.config.ts` foi atualizado para `reuseExistingServer: true`, evitando que o
Playwright tente reiniciar o servidor a cada execução.

### 2. Change-password — usuário temporário

O teste `troca de senha com sucesso` agora:
1. Cria um usuário temporário (via login admin + navegação UI)
2. Faz login como o usuário temporário
3. Troca a senha
4. Aguarda redirect para `/login` (token invalidado pelo PocketBase)
5. Re-loga com a nova senha
6. Exclui o usuário temporário ao final

Isso isola completamente o admin seed das operações de change-password.

### 3. Cleanup entre testes

Cada spec que cria dados (todo-list-management, user-crud, change-password) faz cleanup
próprio via `afterAll`, removendo registros temporários.

### 4. Data-testid

Todos os testes foram migrados para usar seletores `data-testid` (kebab-case) em vez de
`getByLabel`, `getByRole` ou `getByText`, conforme a spec `data-testid-e2e`.

## Como testar

```bash
# Backend primeiro
pnpm backend:dev

# Testes e2e (build + preview + playwright)
pnpm test:e2e

# Ou apenas os testes unitários
pnpm test
```

```bash
pnpm exec playwright test apps/runes/e2e/ --project=chromium
```

## Decisões de design

1. **Script separado na raiz**: O build e preview são executados separadamente para evitar o
   erro `ERR_MODULE_NOT_FOUND` que ocorria quando o Playwright tentava fazer build + preview
   como um único comando.

2. **Usuário temporário via UI**: Em vez de criar fixtures complexas ou usar a API do
   PocketBase diretamente, o teste de change-password cria o usuário navegando na interface
   — o mesmo caminho que um admin real usaria.

3. **`afterAll` em vez de `globalSetup`**: Cleanup é feito por spec (após cada arquivo de
   teste), não globalmente. Mais simples e não requer conexão com PocketBase fora do contexto
   da aplicação.

4. **Re-login manual pós-troca de senha**: O PocketBase invalida o token de autenticação
   quando a senha é alterada. O teste agora lida com isso aguardando o redirect para `/login`
   e fazendo login novamente com a nova senha.

## Links

- Spec: `docs/specs/e2e-test-fix-plan.md`
- Spec data-testid: `docs/specs/data-testid-e2e.md`
- Jira: `docs/workflow/e2e-test-fix-plan.jira.md`
- PR: `docs/workflow/e2e-test-fix-plan.pr.md`
