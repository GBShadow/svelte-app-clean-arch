# CRUD de usuário (runes)

> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Adiciona gestão de usuários para `apps/runes`: admin lista/cria/edita/exclui contas (coordenando `auth`+`user`, com compensação em falha parcial), usuário comum edita o próprio nome/cargo e troca a própria senha, e reset de senha pelo admin aciona o gate de troca obrigatória já existente em `pocketbase-auth`.

## Tipo de mudança

- [x] Nova funcionalidade
- [ ] Correção de bug
- [ ] Refatoração
- [ ] Documentação
- [ ] Chore / tooling

## Alterações

### Domínio
- Não aplicável — sem mudança em `packages/todo-domain`.

### App(s)
- `apps/runes/src/lib/validation/userSchemas.ts` (novo)
- `apps/runes/src/lib/server/userRecord.ts` (novo)
- `apps/runes/src/lib/components/UserForm.svelte`, `UserList.svelte`, `ChangePasswordForm.svelte` (novos)
- `apps/runes/src/routes/users/+page.server.ts` + `+page.svelte` (novos)
- `apps/runes/src/routes/users/new/+page.server.ts` + `+page.svelte` (novos)
- `apps/runes/src/routes/users/[id]/edit/+page.server.ts` + `+page.svelte` (novos)
- `apps/runes/src/routes/change-password/+page.server.ts` + `+page.svelte` (substituem o placeholder de `pocketbase-auth`)
- `apps/runes/src/routes/+layout.svelte` — link "Usuários" para admin

### Infraestrutura
- `pocketbase/pb_migrations/0005_user_auth_rules.js` (novo) — API Rules de `auth`/`user`
- `pocketbase/pb_migrations/0006_fix_seed_admin_email_visibility.js` (novo) — corrige `emailVisibility` da conta seed
- `pocketbase/pb_migrations/0007_restrict_self_update_fields.js` (novo) — **fix de segurança**: fecha privilege escalation via API direta do PocketBase (ver seção dedicada abaixo)

### Testes
- `apps/runes/src/lib/validation/userSchemas.test.ts` (novo, unitário)
- Validação manual ponta a ponta com PocketBase real (Docker, volume limpo) cobrindo AC1–AC10

## Segurança

Revisão automatizada encontrou uma falha de **privilege escalation / broken access control** em `pocketbase/pb_migrations/0005_user_auth_rules.js`: `authCollection.updateRule = "isAdmin=true || id = @request.auth.id"` permitia que **qualquer usuário autenticado** chamasse a API REST do PocketBase diretamente (fora do app SvelteKit — o PocketBase escuta em porta própria, `PUBLIC_POCKETBASE_URL`) e enviasse `PATCH /api/collections/auth/records/{ownId}` com `{"isAdmin": true}`, já que a regra só validava "esse registro é meu", não quais campos podiam mudar.

Corrigido em `0007_restrict_self_update_fields.js` usando os modificadores nativos `:changed`/`:isset` do PocketBase na própria regra (sem precisar de `pb_hooks`): usuário comum não pode alterar `isAdmin` nem `email` no próprio registro, e só pode alterar `mustChangePassword`/`passwordSetAt` quando a mesma requisição também inclui uma troca de senha real (`password:isset = true`) — o que já exige a senha atual correta via `oldPassword`.

Exploit confirmado e depois bloqueado manualmente (requisições diretas à API do PocketBase, fora do app):
- `{"isAdmin": true}` → 200 antes da correção, **404 depois**
- `{"email": "hacker@example.com"}` → **404**
- `{"mustChangePassword": false}` sem senha → **404**
- `{"passwordSetAt": "<agora>"}` sem senha (burlar o prazo de 10 dias) → **404**
- Troca de senha legítima (com `oldPassword` correto) e todas as operações de admin continuam funcionando normalmente.

## Test plan

- [x] `pnpm test`
- [x] `pnpm check`
- [x] `pnpm build`
- [x] Teste manual: `curl` com cookies de admin e usuário comum — listagem, criação, compensação em falha parcial (e-mail duplicado), edição própria vs. de terceiros, exclusão, sincronização de e-mail admin↔auth↔user, troca/reset de senha, gate de 10 dias
- [x] Suíte e2e existente (`auth-cross-tab`, `todo-list`) sem regressão

## Documentação

- Spec: [docs/specs/pocketbase-user-crud.md](../specs/pocketbase-user-crud.md)
- Feature: [docs/features/pocketbase-user-crud.md](../features/pocketbase-user-crud.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

Nenhuma além das já introduzidas por `pocketbase-auth` (login obrigatório). As API Rules de `auth`/`user` mudam de "somente superusuário" para "admin ou o próprio registro" — sem impacto em quem já dependia da regra de auto-consulta de `pocketbase-auth`.

## Issues / Jira

- Closes #[issue]
- Jira: [JIRA-KEY] — [docs/workflow/pocketbase-user-crud.jira.md](./pocketbase-user-crud.jira.md)

## Screenshots

_(opcional — telas de `/users`, `/users/new`, `/users/[id]/edit`)_
