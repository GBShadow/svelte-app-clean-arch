# Plano de Correção — Testes E2E (Playwright)

## Contexto

Atualmente 8 dos 9 testes e2e do app `runes` estão falhando. As causas raiz identificadas são:

1. **Preview server não inicia** — `ERR_MODULE_NOT_FOUND` ao tentar carregar
   `.svelte-kit/output/server/manifest.js` durante o `webServer` do Playwright. O comando
   `pnpm run build && pnpm run preview` falha quando executado como script único do Playwright.

2. **Teste de change-password corrompe o seed** — O teste `troca de senha com sucesso` altera a
   senha do admin seed (`changeme123456`). Se o teste falha no meio do fluxo, a senha fica
   permanentemente alterada e todos os outros testes (que dependem do login seed) quebram.

3. **Auth token invalidado pós-troca de senha** — O PocketBase invalida o token de autenticação
   após `auth.update()` com nova senha. O `hooks.server.ts` tenta `authRefresh()`, falha, limpa
   o store e redireciona para `/login`. O teste original esperava navegação para `/todos`.

4. **Falta de isolamento entre testes** — A fixture compartilha o mesmo login (seed admin) entre
   todos os testes. Não há cleanup de dados entre execuções.

## Objetivo

Corrigir os 8 testes e2e falhos, garantindo:
- Preview server funcional via script separado na raiz
- Isolamento total entre testes (nenhum teste afeta o seed)
- Fluxo de change-password correto (com re-login manual pós-troca)
- Cleanup de dados entre execuções (BeforeEach)
- Manter timeout de 30s com testes otimizados

## Escopo

**Incluído:**

- Criar script `test:e2e` no `package.json` raiz que faz build, sobe preview e roda testes
- Atualizar `playwright.config.ts` para usar `reuseExistingServer: true`
- Criar helper/fixture para criar usuário temporário via UI (login admin → navegar para criar)
- Refatorar `change-password.spec.ts`: usar usuário temporário + re-login manual
- Adicionar `afterAll` nas specs CRUD para cleanup de dados
- Manter fixture de login atual para os testes CRUD (todo-list, user-crud)

**Fora do escopo:**

- Adicionar novos testes e2e
- Modificar testes de unidade
- Alterar a lógica de negócio dos componentes
- Modificar o backend PocketBase (migrations ou seed)
- Modificar hooks.server.ts ou server actions

## Requisitos funcionais

- RF1: O preview server deve iniciar via `pnpm build && pnpm run preview` antes dos testes
- RF2: Playwright deve reusar o servidor existente (não tentar reiniciar)
- RF3: O teste de change-password deve criar um usuário temporário via fixture + UI
- RF4: O usuário temporário deve ser deletado ao final do teste (afterAll/afterEach)
- RF5: Após trocar a senha, o teste deve esperar redirect para `/login` e re-logar com a nova senha
- RF6: O script `test:e2e` da raiz deve ser executável com `pnpm test:e2e`
- RF7: Cada spec deve ser independente (não depender de estado de outros testes)
- RF8: Dados criados por testes devem usar IDs únicos + cleanup via PocketBase API

## Estrutura de mudanças

### 1. Script na raiz (`package.json`)

Adicionar no `package.json` raiz:

```json
{
  "scripts": {
    "test:e2e": "pnpm --filter=runes build && pnpm --filter=runes exec playwright test"
  },
}
```

### 2. Playwright config (`playwright.config.ts`)

Alterar `webServer` para:

```typescript
webServer: {
    command: `pnpm run build && pnpm run preview --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: true, // sempre true, build é feito antes
    timeout: 120_000
}
```

> **Nota:** Como o script raiz já faz `build` antes, o `webServer` só precisa do `preview`. Mas
> manter `build && preview` como fallback para quem rodar `playwright test` diretamente.

### 3. Fixture de teste (`fixtures.ts`)

Manter a fixture atual (login seed admin) como está — ela funciona para os testes CRUD.
Não modificar a fixture existente.

### 4. Change-password test (`change-password.spec.ts`)

Substituir o fluxo atual por:

```
1. Login como admin (via form manual, sem fixture)
2. Navegar para /users/new
3. Criar usuário temporário (nome/email únicos com Date.now)
4. Logout
5. Login como usuário temporário
6. Navegar para /change-password
7. Trocar senha (currentPassword → newPassword)
8. Aguardar redirect para /login (não /todos!)
9. Re-login com a nova senha
10. (Opcional) Trocar senha de volta
11. Logout
12. Login como admin
13. Excluir usuário temporário
```

O teste de erro (senha incorreta) permanece como está, usando login seed.

**Estratégia de criação do usuário temporário:**

Usar a fixture de login existente para obter sessão de admin, mas como o teste de
change-password usa `import { test, expect } from '@playwright/test'` (não usa a fixture),
precisa-se de uma abordagem alternativa:

- Opção A: Criar uma segunda fixture `testWithTempUser` que estende a fixture base
- Opção B: Login manual no início do teste, criar usuário via navegação na UI, depois executar
  o fluxo de change-password

Adotar **Opção B** (login manual + UI) por simplicidade e para não depender de fixtures
compartilhadas.

### 5. Cleanup entre testes

Cada spec que cria dados (todo-list-management, user-crud, change-password) deve fazer
cleanup próprio via `afterAll`:

```typescript
test.afterAll(async () => {
  // Excluir registros criados durante o teste
  // usando IDs únicos armazenados em variáveis do describe
});
```

### 6. Timeout

Manter `timeout: 30_000` (padrão Playwright) — nenhuma alteração necessária.
Os testes devem ser otimizados para executar dentro desse limite.

## Dicionário de data-testid (manter)

Os data-testid já foram implementados nos componentes. Os testes devem continuar usando
`getByTestId` conforme a spec `docs/specs/data-testid-e2e.md`.

## Plano de implementação

1. Atualizar `playwright.config.ts` — `reuseExistingServer: true`
2. Criar script `test:e2e` no `package.json` raiz (build + test)
3. Refatorar `change-password.spec.ts` — usar usuário temporário + re-login
4. Adicionar `afterAll` nos specs CRUD para cleanup de dados
5. Validar: `pnpm test:e2e` passa com 9/9 testes

## Critérios de aceite

- [ ] AC1: `pnpm test:e2e` na raiz faz build + preview + testes sem erro de módulo
- [ ] AC2: O teste de change-password cria usuário temporário, troca senha e faz re-login
- [ ] AC3: Após troca de senha, o teste espera redirect para `/login` (não `/todos`)
- [ ] AC4: Dados temporários são limpos ao final de cada teste
- [ ] AC5: Executar os testes duas vezes seguidas funciona (idempotente)
- [ ] AC6: O seed admin nunca é alterado pelos testes
- [ ] AC7: 9/9 testes passam em todas as execuções
- [ ] AC8: Testes rodam em menos de 30s cada

## Questões em aberto

- O preview server pode ocupar a porta 4175 se um processo anterior não foi encerrado.
  O `--strictPort` garante que falhe se a porta estiver ocupada.
- O cleanup via `afterAll` precisa de acesso ao PocketBase para remover registros.
  Os helpers de acesso ao PB podem usar as mesmas env vars do app
  (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`) definidas em `.env.example`.

## Links

- Spec: `docs/specs/e2e-test-fix-plan.md`
- Spec data-testid: `docs/specs/data-testid-e2e.md`
- Feature doc (pós-implementação): `docs/features/e2e-test-fix-plan.md`
- PR: `docs/workflow/e2e-test-fix-plan.pr.md`
