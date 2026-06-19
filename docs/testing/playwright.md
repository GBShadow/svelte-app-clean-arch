# Playwright (e2e)

Testes end-to-end com [@playwright/test](https://playwright.dev/) contra o app **classic** em modo preview.

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

| Erro | Causa | Correção |
|------|-------|----------|
| `Executable doesn't exist at .../ms-playwright/...` | Chromium não instalado | `pnpm test:e2e:install` (raiz) ou `pnpm exec playwright install chromium` em `apps/classic` |
| `libnspr4.so: cannot open shared object file` (ou libs similares) | Deps do sistema faltando (WSL/Ubuntu) | `cd apps/classic && sudo pnpm exec playwright install-deps` |
| Browser abre e fecha imediatamente / crash ao iniciar | Mesmo que acima — libs incompletas | Rodar `install-deps` com sudo |

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

Localmente (WSL), o config usa **Chromium com UI** (`headless: false`) para evitar problemas com o headless-shell. Em CI (`CI=true`), roda headless.

O `playwright.config.ts` faz `build` + `preview` na porta **4173** automaticamente.

## Estrutura

```
apps/classic/
  playwright.config.ts
  e2e/
    todo-list.spec.ts
```

## UI mode (debug)

```bash
cd apps/classic
pnpm exec playwright test --ui
```
