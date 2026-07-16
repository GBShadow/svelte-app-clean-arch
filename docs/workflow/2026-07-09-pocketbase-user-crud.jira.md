# CRUD de usuário (runes)

Created: 2026-07-09


## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | Medium |
| Labels | pocketbase, users, runes, sveltekit |
| Story Points | 8 |
| Jira Key | [JIRA-KEY] |
| Epic | PocketBase — autenticação e CRUD |

## Description

### Contexto

Com autenticação funcionando, é preciso gerenciar quem pode logar. Não há autocadastro: contas são criadas por admin. Existe hierarquia — admin gerencia todos os usuários; usuário comum só vê/edita o próprio registro.

### Objetivo

Admin cria, lista, edita e exclui usuários (criando `auth`+`user` juntos). Usuário comum vê/edita seus próprios dados (exceto e-mail) e troca a própria senha. Reset de senha pelo admin gera senha temporária com 10 dias de carência.

### Escopo

**Incluído:**
- Listagem, criação, edição e exclusão de usuário (admin)
- Edição restrita ao próprio registro (usuário comum, sem editar e-mail)
- Troca de senha (self) e reset de senha (admin) com gate de 10 dias
- Página `/change-password` funcional
- Validação Zod em todos os formulários

**Fora do escopo:**
- Coleções `auth`/`user` (já criadas em `pocketbase-infra`)
- Hooks/sessão (já existem em `pocketbase-auth`)
- CRUD de todo (task `pocketbase-todo-sharing`)

## Acceptance Criteria

- [x] AC1: Admin vê a lista de todos os usuários em `/users`
- [x] AC2: Usuário comum é redirecionado ao tentar acessar `/users`
- [x] AC3: Admin cria usuário em `/users/new` (auth + user); o novo usuário consegue logar
- [x] AC4: Falha na criação de `user` após sucesso em `auth` remove o registro `auth` (compensação)
- [x] AC5: Usuário comum edita `name`/`jobTitle` do próprio registro; `email` não é editável
- [x] AC6: Usuário comum é bloqueado ao tentar editar outro usuário
- [x] AC7: Admin exclui usuário; login desse usuário deixa de funcionar
- [x] AC7b: Admin altera `email`; `auth.email` e `user.email` ficam sincronizados
- [x] AC8: Troca de senha (self) com senha atual errada é rejeitada
- [x] AC9: Reset de senha pelo admin seta `mustChangePassword`; usuário vê aviso dentro dos 10 dias
- [x] AC10: Após 10 dias sem trocar, usuário é preso em `/change-password` até trocar (gate reaproveitado de `pocketbase-auth`; validado aqui que trocar a senha com sucesso limpa `mustChangePassword` e libera a navegação)
- [x] Testes com `TodoMemoryGateway`/fakes cobrindo os cenários acima (unitários para schemas Zod + validação manual/e2e com PocketBase real)
- [x] `pnpm test` e `pnpm check` sem erros
- [x] Documentação em `docs/features/2026-07-09-pocketbase-user-crud.md`

## Technical Notes (Ports & Adapters — runes)

| Camada | Ação |
|--------|------|
| PocketBase | API Rules `auth`/`user` — migration `pocketbase/pb_migrations/0005_user_auth_rules.js` (spec sugeria `0004`, já usado pelo self-lookup de `pocketbase-auth`) + `0006_fix_seed_admin_email_visibility.js` + `0007_restrict_self_update_fields.js` (restrição de campo contra privilege escalation, achado de revisão de segurança) |
| Server | `apps/runes/src/routes/users/+page.server.ts` (lista, admin only) |
| Server | `apps/runes/src/routes/users/new/+page.server.ts` (criação com compensação) |
| Server | `apps/runes/src/routes/users/[id]/edit/+page.server.ts` (update/resetPassword/delete) |
| Server | `apps/runes/src/routes/change-password/+page.server.ts` |
| UI | `apps/runes/src/lib/components/UserForm.svelte`, `UserList.svelte`, `ChangePasswordForm.svelte`, banner no `+layout.svelte` |
| Validação | `apps/runes/src/lib/validation/userSchemas.ts` (Zod) |
| Testes | `*.test.ts` com fakes para `pb`, cobrindo permissões admin/self |

## Links

- Spec: `docs/specs/2026-07-09-pocketbase-user-crud.md`
- Feature doc: `docs/features/2026-07-09-pocketbase-user-crud.md`
- PR (após implementação): `docs/workflow/2026-07-09-pocketbase-user-crud.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

- [x] API Rules `auth`/`user`
- [x] Listagem + criação (admin)
- [x] Edição (admin + self, sem e-mail para self)
- [x] Exclusão (admin)
- [x] Troca de senha (self) + reset (admin) + gate de 10 dias
- [x] Testes + documentação + PR
