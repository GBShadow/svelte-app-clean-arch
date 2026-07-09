# Autenticação PocketBase (runes)

## Contexto

Com o backend PocketBase disponível ([`pocketbase-infra`](./pocketbase-infra.md)), o app `apps/runes` precisa de login, sessão e proteção de rotas antes de qualquer CRUD (usuário ou todo) poder existir. Hoje `apps/runes` não tem nenhum conceito de usuário logado.

## Objetivo

Usuário consegue logar em `/login` com e-mail/senha, a sessão persiste entre requisições via cookie, rotas não-públicas exigem login, e a rota `/login` fica inacessível para quem já está autenticado.

## Escopo

**Incluído:**

- Client PocketBase server-side (`apps/runes`)
- `hooks.server.ts`: carregar sessão do cookie, popular `event.locals`, redirecionamentos de proteção de rota
- Página `/login` (form action com Zod)
- Logout
- Gate genérico de "troca de senha obrigatória" (mecanismo de redirecionamento; a origem do flag é criada na spec [`pocketbase-user-crud`](./pocketbase-user-crud.md))
- Propagação de login/logout entre abas/janelas da mesma origem via `BroadcastChannel`

**Fora do escopo:**

- Telas de CRUD de usuário (spec [`pocketbase-user-crud`](./pocketbase-user-crud.md))
- Cadastro público (não existe — usuários são criados por admin, ver `pocketbase-user-crud`)
- CRUD de todo (spec [`pocketbase-todo-sharing`](./pocketbase-todo-sharing.md))

## Requisitos funcionais

- RF1: `/login` é pública. Envio de e-mail/senha válidos autentica contra a coleção `auth` do PocketBase e redireciona para `/`.
- RF2: Credenciais inválidas retornam erro exibido no formulário, em português, sem recarregar a página (form action + `fail`).
- RF3: Usuário não autenticado que tentar acessar qualquer rota que não seja `/login` é redirecionado para `/login`.
- RF4: Usuário autenticado que tentar acessar `/login` é redirecionado para `/`.
- RF5: Existe uma ação de logout que limpa a sessão (cookie) e redireciona para `/login`.
- RF6: Em cada requisição autenticada, os dados de perfil (`name`, `email`, `jobTitle`, `isAdmin`) vêm da coleção `user` (busca por `email`), nunca da coleção `auth` — exceto os próprios campos de controle de sessão (`isAdmin`, `mustChangePassword`, `passwordSetAt`), que só existem em `auth`.
- RF7: Se `auth.mustChangePassword = true` e `passwordSetAt` está há mais de 10 dias, qualquer rota que não seja `/change-password` (ou logout) redireciona para `/change-password`. Se está dentro dos 10 dias, a navegação segue normal, mas `locals.user` expõe o aviso para a UI renderizar um banner.
- RF8: Login e logout propagam entre abas/janelas da mesma origem via `BroadcastChannel`: ao completar login com sucesso em uma aba, as demais abas que estejam em `/login` são atualizadas automaticamente (saem de `/login`); ao completar logout em uma aba, as demais abas autenticadas são deslogadas automaticamente e redirecionadas para `/login`, sem precisar de reload manual.

## Requisitos não funcionais

- Cookie de sessão `httpOnly`, `secure` (em produção) e `sameSite=lax`.
- Nenhuma chamada ao PocketBase a partir do client (browser) com credenciais de superusuário — o client PocketBase do browser (se houver) só usa o token do próprio usuário.
- `BroadcastChannel` é client-side e só sincroniza abas da **mesma origem no mesmo navegador** (não substitui a validação server-side, que já é garantida pelo cookie httpOnly + `hooks.server.ts`). Em navegadores sem suporte a `BroadcastChannel`, a aplicação degrada silenciosamente: cada aba continua funcionando normalmente, só sem a sincronização automática (equivalente ao comportamento atual sem esta funcionalidade).
- A mensagem transmitida pelo canal carrega apenas um tipo de evento (`login` | `logout`), nunca dados de sessão/token — o estado real de cada aba é sempre revalidado contra o servidor (via `invalidateAll`), o canal só dispara o gatilho.
- Testes cobrindo: login válido, login inválido, acesso não autenticado a rota protegida, acesso autenticado a `/login`, gate de troca de senha (dentro e fora dos 10 dias), propagação de login/logout entre abas.

## Critérios de aceite

- [ ] AC1: Dado um usuário não autenticado, quando acessa `/`, então é redirecionado para `/login`.
- [ ] AC2: Dado um usuário não autenticado em `/login`, quando submete e-mail/senha corretos (conta seed da spec de infra), então é autenticado e redirecionado para `/`.
- [ ] AC3: Dado um usuário não autenticado em `/login`, quando submete credenciais erradas, então vê a mensagem "E-mail ou senha inválidos." sem sair de `/login`.
- [ ] AC4: Dado um usuário autenticado, quando acessa `/login` diretamente, então é redirecionado para `/`.
- [ ] AC5: Dado um usuário autenticado, quando aciona logout, então o cookie de sessão é limpo e ele é redirecionado para `/login`, voltando ao estado do AC1 se tentar acessar `/`.
- [ ] AC6: Dado `auth.mustChangePassword = true` e `passwordSetAt` há 11 dias, quando o usuário acessa qualquer rota, então é redirecionado para `/change-password` até trocar a senha.
- [ ] AC7: Dado `auth.mustChangePassword = true` e `passwordSetAt` há 3 dias, quando o usuário navega, então acessa normalmente e `locals.user.mustChangePassword` está disponível para a UI mostrar o aviso.
- [ ] AC8: Dado o usuário com duas abas abertas, ambas em `/login`, quando ele loga com sucesso em uma delas, então a outra aba sai de `/login` automaticamente (sem interação manual).
- [ ] AC9: Dado o usuário com duas abas abertas e autenticado em ambas, quando ele faz logout em uma delas, então a outra aba é deslogada e redirecionada para `/login` automaticamente.
- [ ] Testes cobrindo os cenários acima.

## Design (Ports & Adapters — runes)

| Camada | Mudança prevista |
|--------|-------------------|
| Dependência | `apps/runes/package.json` — adicionar `pocketbase` (SDK oficial) |
| Client | `apps/runes/src/lib/server/pocketbase.ts` — factory `createServerClient(event)`: instancia `PocketBase`, `authStore.loadFromCookie(event.request.headers.get('cookie') ?? '')` |
| Hooks | `apps/runes/src/hooks.server.ts` — popula `event.locals.pb`; tenta `pb.collection('auth').authRefresh()`; se válido, busca `user` por `email` e popula `event.locals.user = { id, name, email, jobTitle, isAdmin, mustChangePassword, passwordSetAt }`; aplica os redirecionamentos de RF3/RF4/RF7; grava cookie atualizado na resposta (`pb.authStore.exportToCookie()`) |
| Tipos | `apps/runes/src/app.d.ts` — `App.Locals { pb: PocketBase; user: AuthenticatedUser \| null }` |
| UI | `apps/runes/src/routes/login/+page.svelte` — formulário e-mail/senha |
| Server | `apps/runes/src/routes/login/+page.server.ts` — `load` (redireciona se já autenticado — reforço além do hook), `actions.default` valida com Zod (`loginSchema`), chama `pb.collection('auth').authWithPassword(email, password)`, seta cookie, redireciona |
| Server | `apps/runes/src/routes/logout/+server.ts` — `POST` limpa `authStore`, limpa cookie, redireciona para `/login` |
| UI | `apps/runes/src/routes/change-password/+page.svelte` + `+page.server.ts` — placeholder mínimo nesta spec (form real de troca de senha é detalhado em [`pocketbase-user-crud`](./pocketbase-user-crud.md)); aqui só garante que a rota existe e é alcançável durante o gate |
| Validação | `apps/runes/src/lib/validation/authSchemas.ts` — `loginSchema` (Zod): `email` (email), `password` (string min 1) |
| Client | `apps/runes/src/lib/client/authChannel.ts` — cria `new BroadcastChannel('auth')` (guardado por `typeof BroadcastChannel !== 'undefined'`); expõe `postAuthEvent(type: 'login' \| 'logout')` e `onAuthEvent(callback)` |
| UI | `apps/runes/src/routes/+layout.svelte` — no `onMount`, assina `onAuthEvent`; ao receber `login` ou `logout`, chama `invalidateAll()` do SvelteKit (revalida `load`/hooks contra o cookie real, que já reflete o novo estado), deixando o redirecionamento de RF3/RF4 do `hooks.server.ts` cuidar de mandar a aba para o lugar certo |
| UI | `apps/runes/src/routes/login/+page.svelte` — após `use:enhance` confirmar sucesso do form action de login, chama `postAuthEvent('login')` |
| UI | Botão/form de logout — após confirmar sucesso da ação de logout, chama `postAuthEvent('logout')` antes/durante o redirecionamento |

## Contrato de API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| POST (form action) | `/login` | `email`, `password` (form data) | Redirect 303 `/` ou `fail(400, { error })` |
| POST | `/logout` | — | Redirect 303 `/login` |

## Alternativas consideradas

- **JWT em `localStorage` no client** em vez de cookie `httpOnly`: mais simples de implementar no SDK, mas exposto a XSS e não permite proteção de rota 100% server-side (SSR) — rejeitado a favor de cookie.
- **Checar `mustChangePassword` só no login** em vez de em toda requisição via hook: mais simples, mas não cobre o caso de uma sessão já aberta ultrapassar os 10 dias enquanto o usuário navega — rejeitado; o hook cobre ambos os casos (login novo e sessão em andamento).
- **`storage` event (via `localStorage`)** em vez de `BroadcastChannel` para propagar login/logout: também funciona entre abas, mas exige gravar uma chave em `localStorage` só para disparar o evento (efeito colateral no storage) e tem semântica menos direta — `BroadcastChannel` é a API pensada especificamente para comunicação entre contextos de mesma origem, sem esse efeito colateral.

## Questões em aberto

- Nenhuma no momento.

## Links

- Jira (após aprovação da spec): `docs/workflow/pocketbase-auth.jira.md`
- Feature doc (pós-implementação): `docs/features/pocketbase-auth.md`
- PR: `docs/workflow/pocketbase-auth.pr.md`
- Depende de: [`pocketbase-infra`](./pocketbase-infra.md)
- Specs relacionadas: [`pocketbase-user-crud`](./pocketbase-user-crud.md), [`pocketbase-todo-sharing`](./pocketbase-todo-sharing.md)
