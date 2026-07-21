# Playwright (e2e)

Testes end-to-end com [@playwright/test](https://playwright.dev/) contra o app **runes** (o app `classic` foi movido para `deprecated/`).

| App     | Porta preview | Config                            | Specs             |
| ------- | ------------- | --------------------------------- | ----------------- |
| `runes` | 5175          | `apps/runes/playwright.config.ts` | `apps/runes/e2e/` |

Os passos abaixo usam `apps/runes`.

## Preparação (primeira vez)

Siga os passos **nesta ordem**. Em macOS/Windows, o passo 3 (deps do sistema) normalmente não é necessário.

### 1. Instalar dependências do monorepo

Na **raiz** do repositório:

```bash
pnpm install
```

### 2. Instalar o browser Chromium

Na **raiz**:

```bash
pnpm test:e2e:install
```

Equivalente em `apps/classic`:

```bash
cd apps/classic
pnpm exec playwright install chromium
```

### 3. Instalar dependências do sistema (Linux / WSL)

No **WSL ou Linux**, o Chromium do Playwright precisa de bibliotecas do sistema (ex.: `libnspr4`). Sem elas, o browser não inicia.

Em `apps/classic` — **requer `sudo`**:

```bash
cd apps/classic
sudo pnpm exec playwright install-deps
```

O comando instala os pacotes APT necessários (Ubuntu/Debian). Em outras distros, consulte a [documentação oficial](https://playwright.dev/docs/browsers#install-system-dependencies).

### Resumo rápido (Linux/WSL)

```bash
# raiz
pnpm install
pnpm test:e2e:install

# deps do sistema (sudo)
cd apps/classic
sudo pnpm exec playwright install-deps
```

## Erros comuns

| Erro                                                              | Causa                                 | Correção                                                                                    |
| ----------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `Executable doesn't exist at .../ms-playwright/...`               | Chromium não instalado                | `pnpm test:e2e:install` (raiz) ou `pnpm exec playwright install chromium` em `apps/classic` |
| `libnspr4.so: cannot open shared object file` (ou libs similares) | Deps do sistema faltando (WSL/Ubuntu) | `cd apps/classic && sudo pnpm exec playwright install-deps`                                 |
| Browser abre e fecha imediatamente / crash ao iniciar             | Mesmo que acima — libs incompletas    | Rodar `install-deps` com sudo                                                               |
| Vários testes falham de forma aparentemente não relacionada: `page.waitForURL` estoura o timeout, ou um form volta com erro de validação num campo que o teste preenchiu (ex.: "Nome obrigatório." mesmo após `fill()`) — mas passam se rodados sozinhos/de novo | **Servidor remanescente na porta 5175.** Algum `pnpm dev:runes` (ou outro `vite dev`) ficou rodando de uma sessão anterior. Como `playwright.config.ts` usa `reuseExistingServer: true`, o Playwright reaproveita esse servidor de **dev** em vez de rodar `build` + `preview`, reintroduzindo a instabilidade de hidratação do HMR descrita na seção "Executar" — mesmo com a suíte e o app corretos | 1) `lsof -i :5175` para achar o PID; 2) `kill <PID>`; 3) rodar `pnpm test:e2e` de novo (o config vai buildar e subir o `preview` real). **Diagnóstico rápido:** no log do Playwright, se aparecem linhas `[WebServer] [PLUGIN_TIMINGS]` / `[WebServer] [404] GET /favicon.ico`, o preview real subiu (esperado); se a suíte começa quase instantaneamente **sem** esses logs de build, um servidor pré-existente foi reaproveitado |

## Executar

Na **raiz**:

```bash
pnpm test:e2e
```

Em `apps/classic`:

```bash
cd apps/classic
pnpm test:e2e
```

O script instala o Chromium automaticamente se faltar (passo 2). Em Linux/WSL, as **deps do sistema** (passo 3) **não** são instaladas automaticamente — rode `install-deps` manualmente na primeira vez.

A suíte roda sempre **headless** (`headless: true`), local e em CI — nenhuma janela de navegador é aberta.

O `playwright.config.ts` faz `build` + `preview` na porta 5175. O dev server não é usado: o websocket de HMR do Vite deixa a hidratação instável e os formulários chegam a ser submetidos vazios.

`reuseExistingServer: true` faz o Playwright pular esse `build`/`preview` se **já houver algo ouvindo na porta 5175** — incluindo um `pnpm dev:runes` esquecido rodando. Isso reintroduz a instabilidade do dev server silenciosamente (a suíte não avisa que está usando o servidor errado). Antes de investigar falhas estranhas em massa, confira se a porta está livre: `lsof -i :5175`. Se houver um processo, encerre-o antes de rodar `pnpm test:e2e` (veja a tabela de erros comuns acima).

## Estrutura

```
apps/runes/
  playwright.config.ts
  e2e/
    env.ts                    ← constantes do seed + guard fail-fast (assertSeedAdmin)
    fixtures.ts               ← login como admin (com guard) antes de cada teste
    cleanup.ts                ← limpeza de registros via API PocketBase (user+auth, listas)
    auth-cross-tab.spec.ts
    todo-crud-basico.spec.ts
    change-password.spec.ts
    user-crud.spec.ts
    todo-list-management.spec.ts
```

Se a suíte quebrar em massa no login, a causa provável é o seed admin com senha divergente — o guard
falha rápido com a mensagem "Rode: pnpm backend:reset". Rode `pnpm backend:reset` para recriar o seed.

### Pré-requisito extra: `apps/runes` exige o PocketBase rodando

Desde a autenticação PocketBase (`docs/features/2026-07-09-pocketbase-auth.md`), todas as rotas de `apps/runes` exigem login — `e2e/fixtures.ts` loga com a conta seed antes de cada teste. Suba o backend antes de rodar `pnpm test:e2e` em `runes`:

```bash
cp .env.example .env   # se ainda não existir
pnpm backend:dev
```

O `.env` da raiz precisa ter `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` — o fixture usa esses valores (ou os defaults de `.env.example`) para logar via `/login` antes de cada teste.

## UI mode (debug)

```bash
cd apps/classic
pnpm exec playwright test --ui
```
