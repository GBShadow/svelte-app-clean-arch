# CRUD de usuário (runes)

## Resumo

Gestão de usuários para `apps/runes`: admin lista, cria, edita e exclui contas (criando `auth`+`user` juntos, com compensação em falha parcial); usuário comum edita o próprio nome/cargo e troca a própria senha; reset de senha pelo admin ativa o gate de troca obrigatória (10 dias) já existente em `pocketbase-auth`.

## App(s) afetado(s)

- **runes** — `/users`, `/users/new`, `/users/[id]/edit`, `/change-password` (agora funcional)

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Infra (PocketBase) | `pocketbase/pb_migrations/0005_user_auth_rules.js` — API Rules de `auth`/`user` |
| Infra (PocketBase) | `pocketbase/pb_migrations/0006_fix_seed_admin_email_visibility.js` — corrige `emailVisibility` da conta seed |
| Infra (PocketBase) | `pocketbase/pb_migrations/0007_restrict_self_update_fields.js` — impede autopromoção/self-bypass via API direta do PocketBase (achado de revisão de segurança) |
| Validação | `apps/runes/src/lib/validation/userSchemas.ts` — `createUserSchema`, `updateUserSchema`, `adminEmailSchema`, `resetPasswordSchema`, `changePasswordSchema`, `fieldErrorsFrom` |
| Tipos | `apps/runes/src/lib/server/userRecord.ts` |
| UI | `apps/runes/src/lib/components/UserForm.svelte`, `UserList.svelte`, `ChangePasswordForm.svelte` |
| Server | `apps/runes/src/routes/users/+page.server.ts` (lista, admin only) |
| Server/UI | `apps/runes/src/routes/users/new/+page.server.ts` + `+page.svelte` (criação com compensação) |
| Server/UI | `apps/runes/src/routes/users/[id]/edit/+page.server.ts` + `+page.svelte` (`update`/`resetPassword`/`delete`) |
| Server/UI | `apps/runes/src/routes/change-password/+page.server.ts` + `+page.svelte` (substitui o placeholder de `pocketbase-auth`) |
| UI | `apps/runes/src/routes/+layout.svelte` — link "Usuários" para admin |
| Testes | `apps/runes/src/lib/validation/userSchemas.test.ts` |

## Fluxo (Ports & Adapters)

```
/users (load)
  → guard: locals.user.isAdmin, senão redirect /
  → pb.collection('user').getFullList()  [listRule: isAdmin || self]

/users/new (actions.default, admin only)
  → valida createUserSchema (Zod)
  → pb.collection('auth').create({ email, emailVisibility: true, password, ..., isAdmin: false })
  → pb.collection('user').create({ name, email, jobTitle })
  → falha no 2º passo → compensação: pb.collection('auth').delete(authId)

/users/[id]/edit (load: admin ou self)
  actions.update
    → name/jobTitle sempre; email só se isAdmin e diferente do atual
    → se email mudou: acha auth via filter(email = user.email) → atualiza auth.email → atualiza user.email/name/jobTitle
    → falha após atualizar auth.email → compensação: reverte auth.email para o valor anterior
  actions.resetPassword (admin only)
    → acha auth via filter(email) → update(password/passwordConfirm sem oldPassword, mustChangePassword: true, passwordSetAt: now)
      [permitido via manageRule, que dá acesso "manage" ao admin]
  actions.delete (admin only)
    → acha auth via filter(email) → deleta user → deleta auth

/change-password (actions.default, self)
  → valida changePasswordSchema
  → pb.collection('auth').update(authStore.record.id, { oldPassword, password, passwordConfirm, mustChangePassword: false, passwordSetAt: now })
    [oldPassword errado → ClientResponseError → fail(400, { currentPassword: 'Senha atual incorreta.' })]
  → sucesso → redirect / (gate de pocketbase-auth libera a navegação, pois mustChangePassword vira false)
```

## API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/users` | — (admin) | Lista de usuários |
| POST (form action) | `/users/new` | `name`, `email`, `jobTitle`, `password`, `confirmPassword` | Redirect `/users` ou `fail(400, {errors})` |
| POST (form action) | `/users/[id]/edit` (`?/update`) | `name`, `jobTitle`, `email?` | Redirect ou `fail(400, {errors})` |
| POST (form action) | `/users/[id]/edit` (`?/resetPassword`) | `password`, `confirmPassword` | `{success:true}` ou `fail(400, {errors})` |
| POST (form action) | `/users/[id]/edit` (`?/delete`) | — | Redirect `/users` |
| POST (form action) | `/change-password` | `currentPassword`, `password`, `confirmPassword` | Redirect `/` ou `fail(400, {errors})` |

## Como testar

```bash
cp .env.example .env
pnpm backend:dev
pnpm --filter runes dev
pnpm --filter runes test
pnpm --filter runes test:e2e
```

Validação manual executada com PocketBase real (Docker, volume limpo, todas as migrations 0001–0007 do zero) e sessões reais de admin/usuário comum via `curl`/`fetch` com cookie jar:

- AC1/AC2: listagem só para admin.
- AC3: criação de usuário + login com as credenciais novas.
- AC4: compensação — provocada uma falha de `user.update` por e-mail duplicado (índice único) após `auth.update` já ter mudado o e-mail; confirmado que o `auth.email` volta ao valor anterior e o usuário original continua logando normalmente.
- AC5/AC6: usuário comum edita o próprio nome/cargo; bloqueado ao tentar `/users/[outro-id]/edit`.
- AC7/AC7b: exclusão remove `user`+`auth` (login para de funcionar); troca de e-mail pelo admin sincroniza `auth.email`+`user.email` (login com e-mail antigo falha, com o novo funciona).
- AC8: troca de senha própria com senha atual errada é rejeitada sem alterar a senha; com a senha certa, funciona e limpa `mustChangePassword`.
- AC9: reset de senha pelo admin ativa `mustChangePassword=true`; usuário vê o banner de aviso ao navegar dentro dos 10 dias.
- AC10: o bloqueio após 10 dias reaproveita o gate já validado em `pocketbase-auth` (`isPasswordExpired`, testado com casos de 11 e 3 dias); esta spec valida especificamente que a troca de senha bem-sucedida limpa `mustChangePassword` e libera a navegação (comprovado no teste do AC8).
- `pnpm test`, `pnpm check`, `pnpm build` e a suíte e2e completa (`auth-cross-tab` + `todo-list`) sem regressões.
- **Achado de revisão de segurança (privilege escalation)**: com `authCollection.updateRule = "isAdmin=true || id = self"` (sem restrição de campo), qualquer usuário comum podia chamar a API do PocketBase **diretamente** (fora do app SvelteKit, que só está no mesmo host/rede) e enviar `PATCH /api/collections/auth/records/{ownId} { "isAdmin": true }` — a regra só valida "esse registro pertence a mim", não "quais campos posso mudar". Confirmado o exploit funcionando antes da correção (200, campo alterado) e bloqueado depois (404) com quatro cenários: auto-promoção a admin, alteração direta de e-mail, limpeza de `mustChangePassword` sem provar a senha atual, e adulteração de `passwordSetAt` para burlar o prazo de 10 dias — todos bloqueados pela migration `0007`, mantendo intactas as trocas de senha legítimas (com `oldPassword` correto) e todas as operações de admin.

## Decisões de design

- **Migration renumerada**: a spec sugeria `0004_user_auth_rules.js`, mas `0004` já tinha sido usado pelo self-lookup adicionado durante `pocketbase-auth`. Usada `0005_user_auth_rules.js`.
- **Bug real encontrado — `auth.updateRule` precisa incluir admin, não só `manageRule`**: a primeira versão da migration deixou `auth.updateRule = "id = @request.auth.id"` e contava com `manageRule = "@request.auth.isAdmin = true"` para o admin editar outros registros. Na prática, `manageRule` só libera capacidades extras (trocar senha sem `oldPassword`, setar e-mail direto) para quem **já passa** em `updateRule` — não é um substituto independente dele. Corrigido para `authCollection.updateRule = "@request.auth.isAdmin = true || id = @request.auth.id"`, mantendo `manageRule` só para as capacidades elevadas.
- **Bug real encontrado — `emailVisibility` bloqueia filtro por e-mail**: PocketBase não permite filtrar/listar por um campo oculto (`email` com `emailVisibility=false`) para quem não é o dono do registro, mesmo com `listRule`/`viewRule` liberando a linha — o resolver de filtro rejeita campos ocultos por padrão. Como o fluxo inteiro depende de localizar o registro `auth` por e-mail a partir do admin, toda criação de usuário agora seta `emailVisibility: true`; a conta seed (criada antes dessa descoberta) foi corrigida via `0006_fix_seed_admin_email_visibility.js` — uma migration nova, não uma edição retroativa de `0003`.
- **`auth.listRule`/`viewRule`** também precisaram ser abertos para `isAdmin = true || id = self` — a spec original (Technical Notes) não detalhava essas duas regras, só `updateRule`/`manageRule`/`createRule`/`deleteRule`; sem elas, o admin não conseguia nem localizar o registro para editar/resetar/excluir.
- **Sincronização de e-mail com compensação manual** (RF3): sem transações reais entre duas coleções sem relação formal, a ordem escolhida foi atualizar `auth.email` primeiro e reverter no catch se `user.update` falhar depois — mesma lógica da criação (RF2).
- **`/change-password` usa `oldPassword` nativo do PocketBase** em vez de uma chamada extra de `authWithPassword` para validar a senha atual — o próprio `update()` com `oldPassword` já rejeita com erro claro se a senha atual estiver errada, evitando uma segunda autenticação redundante.
- **Restrição de campo por regra, não por hook** (`0007_restrict_self_update_fields.js`): em vez de um `pb_hooks/*.pb.js` interceptando `onRecordUpdateRequest`, a proteção foi expressa direto no `updateRule` com os modificadores nativos `:changed`/`:isset` do PocketBase (`@request.body.isAdmin:changed = false`, `@request.body.email:changed = false`, `@request.body.password:isset = true` como condição para liberar `mustChangePassword`/`passwordSetAt`). Evita introduzir um mecanismo novo (hooks JS, com seu próprio `COPY` no Dockerfile) quando a linguagem de regras do PocketBase já resolve o caso — migrations continuam sendo a única fonte de configuração do backend.
