# Correção dos Testes E2E (Playwright) + endurecimento de segurança

## Resumo

Os 10 testes e2e do app `runes` falhavam em massa. A causa raiz não era o código de teste, e sim
o banco: o teste antigo de troca de senha alterava a senha do **admin seed** e não conseguia
revertê-la (o PocketBase invalida o token após a troca e o app redireciona para `/login`), deixando
o seed permanentemente envenenado. Todo login subsequente da suíte quebrava.

Ao destravar o banco e executar os testes de verdade, dois problemas adicionais apareceram, um deles
uma vulnerabilidade real. A entrega corrige os testes, fecha a brecha e adiciona defesas para o
problema não voltar de forma silenciosa.

## App(s) afetado(s)

runes (e2e) + backend PocketBase

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Config | `apps/runes/playwright.config.ts`, `package.json` (raiz) |
| Testes e2e | `e2e/env.ts` (novo), `e2e/cleanup.ts` (novo), `e2e/fixtures.ts` |
| Testes e2e | `change-password.spec.ts`, `user-crud.spec.ts`, `todo-list-management.spec.ts`, `todo-crud-basico.spec.ts` (renomeado de `todo-sharing`), `auth-cross-tab.spec.ts` |
| Segurança (app) | `apps/runes/src/routes/change-password/+page.server.ts` |
| Segurança (infra) | `pocketbase/docker-entrypoint.sh`, `pocketbase/docker-compose.yml` |

## Mudanças

### 1. webServer: build + preview (não dev)

O `playwright.config.ts` sobe `pnpm run build && pnpm run preview` na porta 5175. No dev server, o
websocket de HMR do Vite deixa a hidratação não-determinística: os testes preenchiam os formulários
antes de o Svelte hidratar, a re-renderização limpava os inputs e o submit ia vazio (a criação de
usuário falhava com "Nome obrigatório"). O preview (build de produção, sem HMR) elimina essa corrida.
O `test:e2e` da raiz builda antes de rodar o Playwright.

### 2. Guard fail-fast do seed (`e2e/env.ts`)

Antes de logar pela UI, a fixture autentica o seed admin direto na API do PocketBase. Se a credencial
divergiu, o teste falha em ~0,5s com uma mensagem clara ("Rode: pnpm backend:reset") em vez de 30s de
timeout opaco. Os specs que fazem login manual (`auth-cross-tab`, `change-password`) chamam o mesmo
guard em `beforeEach`. As constantes do seed (`PB_API_URL`, `SEED_EMAIL`, `SEED_PASSWORD`), antes
duplicadas em três arquivos, ficam centralizadas aqui.

### 3. Cleanup por teste via API PocketBase (`e2e/cleanup.ts`)

Cada spec que cria dados limpa em `try/finally` via API do PocketBase. Endurecimentos:
- **Falhas são ruidosas** (`console.warn`), nunca engolidas em silêncio — foi o silêncio que deixou o
  banco acumular lixo sem ninguém notar.
- **Limpa `user` e `auth`** (`cleanupUser`): criar um usuário grava nas duas coleções; antes só `user`
  era limpo, deixando o registro `auth` órfão a cada execução.
- **Filtro parametrizado** (`pbFilter`, placeholders `{:x}`), espelhando o `pb.filter()` do app.

### 4. Change-password com usuário temporário

O teste de troca de senha cria um usuário temporário via UI, loga como ele, troca a senha, aguarda o
redirect para `/login` (token invalidado) e re-loga com a nova senha. O admin seed nunca é tocado.

### 5. Correção de segurança — troca de senha exige a senha atual

Descoberto pelo teste "senha atual incorreta": a collection `auth` tem `manageRule: isAdmin = true`, e
o PocketBase **dispensa a verificação de `oldPassword` para quem casa o manageRule**. Ou seja, um
admin trocava a própria senha (ou seria capaz de trocar via API) sem informar a atual. A action
`change-password/+page.server.ts` agora **reautentica explicitamente** com a senha atual (via
`authWithPassword` num cliente isolado) antes de aplicar a troca, fechando a brecha para todos os
perfis. O teste passou a exercer o caminho com um usuário não-admin e o testid correto
(`error-current-password`).

### 6. Endurecimento do entrypoint do PocketBase

`docker-entrypoint.sh` recusa subir se `PB_ADMIN_PASSWORD` ou `SEED_ADMIN_PASSWORD` ainda forem a
senha de exemplo do `.env.example` (`changeme123456`), evitando expor o painel `/_/` (publicado em
`0.0.0.0:8090`) com credencial pública num deploy real. Desenvolvimento local libera explicitamente
via `ALLOW_INSECURE_ADMIN_PASSWORD=true` no `docker-compose.yml`.

## Como testar

```bash
pnpm backend:reset      # garante seed admin íntegro
pnpm test:e2e           # build + preview + playwright → 10 passed
pnpm test:e2e           # de novo, sem reset → idempotente, sem resíduo no banco
```

## Decisões de design

1. **Preview em vez de dev**: única forma de tornar a hidratação determinística; sem ela, a criação de
   usuário pisca. Custo aceito: cada execução paga o build.
2. **Guard na fixture, não em `global-setup.ts`**: mantém a decisão de não reintroduzir global setup;
   troca 5 min de timeouts por uma mensagem imediata.
3. **Reautenticação para verificar a senha atual**: não dá para confiar no `oldPassword` do PocketBase
   quando o requester é admin; a verificação explícita vale para todos os perfis.

## Achados de segurança ainda abertos (fora desta entrega)

- **Compartilhamento amplo**: `public = true` torna a lista legível por **qualquer** usuário
  autenticado; não há compartilhamento por usuário específico. Decisão de produto pendente.
- **Gate de troca de senha** (`hooks.server.ts`): usa `mustChangePassword && isPasswordExpired`; como o
  reset grava `passwordSetAt = now`, a senha temporária conhecida pelo admin fica válida por 10 dias
  sem troca obrigatória.

## Links

- Spec: `docs/specs/e2e-test-fix-plan.md`
- Spec data-testid: `docs/specs/data-testid-e2e.md`
- Jira: `docs/workflow/e2e-test-fix-plan.jira.md`
- PR: `docs/workflow/e2e-test-fix-plan.pr.md`
