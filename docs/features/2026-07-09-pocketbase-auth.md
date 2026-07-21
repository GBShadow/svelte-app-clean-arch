# Autenticação PocketBase (runes)

Created: 2026-07-09


## Resumo

Login/sessão para `apps/runes` contra o PocketBase: cookie `httpOnly`, todas as rotas exigem autenticação (exceto `/login`), gate de troca de senha obrigatória após 10 dias, e sincronização de login/logout entre abas via `BroadcastChannel`.

## App(s) afetado(s)

- **runes** — `hooks.server.ts`, rotas `/login`, `/logout`, `/change-password`, `+layout.svelte`

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Dependência | `apps/runes/package.json` — `pocketbase`, `zod` |
| Config | `apps/runes/vite.config.ts` — `envDir`/`env.dir` apontando para `.env` da raiz |
| Server | `apps/runes/src/lib/server/pocketbase.ts` (`createServerClient`), `apps/runes/src/lib/server/authUser.ts` (tipo `AuthenticatedUser`) |
| Tipos | `apps/runes/src/app.d.ts` — `App.Locals { pb, user }` |
| Hooks | `apps/runes/src/hooks.server.ts` — sessão, redirecionamentos, gate de senha |
| Domínio auxiliar | `apps/runes/src/lib/auth/passwordGate.ts` (`isPasswordExpired`, testável) |
| Validação | `apps/runes/src/lib/validation/authSchemas.ts` (`loginSchema`, Zod) |
| UI/Server | `apps/runes/src/routes/login/+page.svelte` + `+page.server.ts` |
| Server | `apps/runes/src/routes/logout/+server.ts` |
| UI/Server | `apps/runes/src/routes/change-password/+page.svelte` + `+page.server.ts` (placeholder) |
| Client | `apps/runes/src/lib/client/authChannel.ts` (`BroadcastChannel`) |
| UI | `apps/runes/src/routes/+layout.svelte`, `+layout.server.ts` — navbar com logout, banner de troca de senha, assina `onAuthEvent` |
| Infra (PocketBase) | `pocketbase/pb_migrations/0004_allow_self_lookup_on_user_collection.js` — regra de API para auto-consulta em `user` |
| e2e | `apps/runes/e2e/fixtures.ts` (login antes de cada teste), `apps/runes/e2e/auth-cross-tab.spec.ts` (novo) |
| Testes unitários | `passwordGate.test.ts`, `authSchemas.test.ts`, `authChannel.test.ts` |

## Fluxo (Ports & Adapters)

```
Requisição
  → hooks.server.ts (handle)
      → createServerClient(event): PocketBase + authStore.loadFromCookie
      → pb.collection('auth').authRefresh() (se cookie válido)
      → pb.collection('user').getFirstListItem(email = auth.email)  [pb.filter, sem injeção]
      → monta locals.user = { id, name, email, jobTitle, isAdmin, mustChangePassword, passwordSetAt }
      → redireciona conforme RF3/RF4/RF7 (login obrigatório, /login bloqueado se já logado, gate de senha)
      → resolve(event)
      → exportToCookie({ secure: !dev, httpOnly, sameSite: 'lax' }) na resposta

/login (+page.server.ts)
  → actions.default: valida com loginSchema (Zod) → pb.collection('auth').authWithPassword(...)
      → sucesso: redirect 303 /  (cookie setado pelo hook no resolve)
      → falha (Zod ou ClientResponseError): fail(400, { error: 'E-mail ou senha inválidos.' })

/logout (+server.ts)
  → POST: locals.pb.authStore.clear() → redirect 303 /login (cookie limpo pelo hook no resolve)

BroadcastChannel ('auth')
  → login: +page.svelte chama postAuthEvent('login') após redirect confirmado (use:enhance)
  → logout: +layout.svelte faz fetch('/logout') manual (aguarda cookie limpo), só then
      postAuthEvent('logout') + goto('/login') — evita corrida com outras abas
  → +layout.svelte (onMount): onAuthEvent(() => invalidateAll()) em todas as abas,
      deixando hooks.server.ts redirecionar cada uma para o lugar certo
```

## API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| POST (form action) | `/login` | `email`, `password` (form data) | Redirect 303 `/` ou `fail(400, { error })` |
| POST | `/logout` | — | Redirect 303 `/login` |

API nativa do PocketBase consumida: `POST /api/collections/auth/auth-with-password`, `POST /api/collections/auth/auth-refresh`, `GET /api/collections/user/records` (filtro por `email`, permitido só para o próprio registro via regra de API).

## Como testar

```bash
cp .env.example .env   # se ainda não existir
pnpm backend:dev         # PocketBase em http://127.0.0.1:8090
pnpm --filter runes dev  # http://localhost:5175
pnpm --filter runes test # unitários (passwordGate, authSchemas, authChannel)
pnpm --filter runes test:e2e  # inclui auth-cross-tab.spec.ts (requer backend rodando)
```

Validação executada nesta implementação:

- Unitários (Vitest): `isPasswordExpired` (borda dos 10 dias, valores nulos/inválidos), `loginSchema` (válido/inválido), `authChannel` (entrega de evento + degradação sem `BroadcastChannel`).
- Manual com PocketBase real (Docker) + `curl` com cookie jar: AC1–AC7 (redirecionamentos, login válido/inválido, logout, gate de troca de senha com usuários de teste `mustChangePassword=true` em 11 e 3 dias).
- e2e Playwright com Chromium real, duas abas no mesmo contexto de navegador: AC8 (login sincroniza) e AC9 (logout sincroniza) — `apps/runes/e2e/auth-cross-tab.spec.ts`.
- Suite completa do monorepo (`pnpm test`, `pnpm check`) sem regressões nos apps `classic`/`remote`.

## Decisões de design

- **Regra de API nova na coleção `user`** (`pocketbase/pb_migrations/0004_...`): a spec de infra deixou `user` com regras padrão (somente superusuário); autenticação via `auth` collection não tinha permissão de autoconsulta. Adicionada `listRule`/`viewRule` = `@request.auth.id != '' && email = @request.auth.email` — cada usuário só enxerga o próprio registro, sem abrir listagem geral (isso fica para `pocketbase-user-crud`, que definirá regras de administração).
- **Logout não usa `use:enhance`**: `/logout` é um `+server.ts` (conforme a spec), que não produz o formato de "action result" que `use:enhance` espera — tentar interceptar como form action gerava erro 500 (`Unexpected token '<'`) ao tentar parsear HTML como JSON. A troca de senha entre abas usa `fetch('/logout')` manual + `postAuthEvent('logout')` só após a resposta confirmar cookie limpo, evitando uma corrida em que a aba B revalida contra um cookie ainda válido.
- **`passwordSetAt` vazio/nulo é tratado como expirado** (`isPasswordExpired`): força troca imediata para contas com `mustChangePassword=true` que ainda não têm a marca de tempo definida.
- **`envDir`/`env.dir` apontando para a raiz do monorepo**: o `.env` fica em um único lugar (`pocketbase-infra`), compartilhado entre o container PocketBase e os apps SvelteKit — evita duplicar segredos por app.
- **`id`, `name`, `email`, `jobTitle` vêm da coleção `user`; `isAdmin`, `mustChangePassword`, `passwordSetAt` vêm de `auth`** — mantém a separação definida na spec de infra entre identidade de aplicação e controle de sessão.
