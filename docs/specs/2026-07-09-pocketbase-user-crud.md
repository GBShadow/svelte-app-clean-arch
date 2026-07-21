# CRUD de usuário (runes)

Created: 2026-07-09


## Contexto

Com autenticação funcionando ([`pocketbase-auth`](./2026-07-09-pocketbase-auth.md)), é preciso gerenciar quem pode logar no sistema. Não há autocadastro: contas são criadas por um admin. Existe uma hierarquia simples — admin gerencia todos os usuários; usuário comum só vê/edita o próprio registro.

## Objetivo

Admin consegue criar, listar, editar e excluir usuários (criando `auth`+`user` juntos). Usuário comum consegue ver e editar seus próprios dados (exceto e-mail) e trocar a própria senha. Reset de senha feito pelo admin gera senha temporária com prazo de troca de 10 dias.

## Escopo

**Incluído:**

- Listagem de usuários (admin)
- Criação de usuário: formulário único cria `auth` (e-mail/senha/nome) + `user` (nome/e-mail/cargo) (admin)
- Edição: admin edita qualquer usuário; usuário comum edita apenas o próprio registro (nome e cargo, não e-mail)
- Exclusão de usuário (admin)
- Troca de senha pelo próprio usuário (exige senha atual)
- Reset de senha pelo admin → marca `mustChangePassword`/`passwordSetAt`, sem exigir senha atual
- Página `/change-password` funcional (completando o placeholder da spec de auth)
- Validação Zod em todos os formulários

**Fora do escopo:**

- Definição das coleções `auth`/`user` (já criadas em [`pocketbase-infra`](./2026-07-09-pocketbase-infra.md))
- Mecanismo de sessão/hook (já existe em [`pocketbase-auth`](./2026-07-09-pocketbase-auth.md))
- CRUD de todo (spec [`pocketbase-todo-sharing`](./2026-07-09-pocketbase-todo-sharing.md))

## Requisitos funcionais

- RF1: Rota `/users` (lista) e `/users/new` (criação) só são acessíveis para `locals.user.isAdmin === true`; caso contrário, redireciona para `/` (ou 403).
- RF2: Criação (admin): formulário com `name`, `email`, `jobTitle` (select `senior|mid|junior|intern`), `password`, `confirmPassword`. Ação cria o registro em `auth` e, em seguida, o registro em `user` com o mesmo e-mail; se a criação em `user` falhar, o registro em `auth` recém-criado é removido (compensação manual).
- RF3: Edição — admin pode editar `name`, `jobTitle` e `email` de qualquer usuário (via `/users/[id]/edit`); usuário comum só acessa `/users/[id]/edit` quando `[id]` é o próprio registro, e não pode alterar `email` (campo desabilitado/ignorado no submit). Ao admin alterar o `email`, a ação atualiza **`user.email` e `auth.email` juntos** (mesma transação lógica que a criação, com a mesma compensação em caso de falha parcial) — como não há relação formal entre as tabelas, o e-mail é o único vínculo usado pelo hook de autenticação para localizar o perfil, e uma dessincronia quebraria esse vínculo.
- RF4: Exclusão (admin): remove o registro em `user` e o registro correspondente em `auth` (buscado por e-mail).
- RF5: Troca de senha pelo próprio usuário (`/change-password` ou seção da edição do próprio perfil): exige senha atual + nova senha + confirmação; limpa `mustChangePassword`/`passwordSetAt` ao concluir.
- RF6: Reset de senha pelo admin (a partir da tela de edição de outro usuário): define nova senha sem pedir a senha atual, seta `mustChangePassword = true` e `passwordSetAt = now`.
- RF7: Enquanto `mustChangePassword = true` e dentro de 10 dias de `passwordSetAt`, o usuário vê um aviso persistente (banner) informando o prazo restante para trocar a senha.
- RF8: Após 10 dias de `passwordSetAt` com `mustChangePassword = true`, o hook de auth (RF7 de `pocketbase-auth`) já bloqueia a navegação fora de `/change-password` — esta spec garante que `/change-password` está implementada e funcional para destravar o usuário.

## Requisitos não funcionais

- Todas as mutações (criar/editar/excluir usuário, resetar senha) exigem checagem server-side de `locals.user.isAdmin` (ou de identidade própria, conforme o caso) — nunca confiar apenas em esconder botões na UI.
- API Rules do PocketBase na coleção `user`: `listRule`/`viewRule`/`updateRule` = `@request.auth.isAdmin = true || email = @request.auth.email`; `createRule`/`deleteRule` = `@request.auth.isAdmin = true`.
- API Rules na coleção `auth`: `updateRule` (troca de senha/perfil) = `@request.auth.isAdmin = true || id = @request.auth.id`; `createRule`/`deleteRule` = `@request.auth.isAdmin = true`.
- Testes cobrindo: criação com rollback em falha, usuário comum não conseguindo editar e-mail ou outro usuário, admin conseguindo tudo, gate de senha temporária.

## Critérios de aceite

- [ ] AC1: Dado um admin autenticado, quando acessa `/users`, então vê a lista de todos os usuários com `name`, `email`, `jobTitle`.
- [ ] AC2: Dado um usuário comum autenticado, quando acessa `/users`, então é redirecionado (sem acesso à listagem).
- [ ] AC3: Dado um admin em `/users/new`, quando preenche `name`/`email`/`jobTitle`/`password` válidos, então um novo usuário consegue logar em `/login` com essas credenciais e seu perfil aparece em `/users`.
- [ ] AC4: Dado um admin em `/users/new`, quando a criação em `user` falha após a criação em `auth` ter sucesso (simulado em teste), então o registro em `auth` é removido (sem conta "fantasma").
- [ ] AC5: Dado um usuário comum autenticado, quando acessa `/users/[seu-id]/edit`, então consegue alterar `name`/`jobTitle`, mas o campo `email` não é editável.
- [ ] AC6: Dado um usuário comum autenticado, quando tenta acessar `/users/[id-de-outro]/edit`, então é bloqueado.
- [ ] AC7: Dado um admin, quando exclui um usuário, então o login desse usuário deixa de funcionar (`auth` removido) e ele some de `/users`.
- [ ] AC7b: Dado um admin, quando altera o `email` de um usuário, então esse usuário passa a logar com o **novo** e-mail (`auth.email` atualizado) e seu perfil em `/users` reflete o novo e-mail (`user.email` atualizado) — ambos permanecem sincronizados.
- [ ] AC8: Dado um usuário comum trocando a própria senha, quando informa a senha atual errada, então vê erro e a senha não é alterada.
- [ ] AC9: Dado um admin resetando a senha de outro usuário, quando salva, então esse usuário passa a ter `mustChangePassword = true`; ao logar, vê aviso de troca pendente dentro dos 10 dias.
- [ ] AC10: Dado um usuário com `mustChangePassword = true` há mais de 10 dias, quando tenta navegar para qualquer rota, então cai em `/change-password`, e ao trocar a senha com sucesso volta a navegar livremente.
- [ ] Testes cobrindo os cenários acima.

## Design (Ports & Adapters — runes)

| Camada | Mudança prevista |
|--------|-------------------|
| PocketBase | API Rules das coleções `auth`/`user` (ver Requisitos não funcionais) — ajuste feito via migration adicional em `pocketbase/pb_migrations/0004_user_auth_rules.js` (spec de infra é estendida aqui, pois as regras dependem dos campos `isAdmin`, já presentes) |
| Server | `apps/runes/src/routes/users/+page.server.ts` — `load` (admin only) lista `user` |
| Server | `apps/runes/src/routes/users/new/+page.server.ts` — `actions.default`: valida com Zod, cria `auth` + `user`, compensa em falha |
| Server | `apps/runes/src/routes/users/[id]/edit/+page.server.ts` — `load` resolve permissão (admin ou self); `actions.update` (nome/cargo/e-mail conforme papel); `actions.resetPassword` (admin, seta `mustChangePassword`); `actions.delete` (admin) |
| Server | `apps/runes/src/routes/change-password/+page.server.ts` — `actions.default`: valida senha atual (self) via `authWithPassword`, atualiza senha, limpa `mustChangePassword`/`passwordSetAt` |
| UI | `apps/runes/src/lib/components/UserForm.svelte`, `UserList.svelte`, `ChangePasswordForm.svelte`, banner de aviso no `+layout.svelte` raiz quando `locals.user.mustChangePassword` |
| Validação | `apps/runes/src/lib/validation/userSchemas.ts` — `createUserSchema`, `updateUserSchema` (sem `email`), `resetPasswordSchema`, `changePasswordSchema` (Zod) |

## Contrato de API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/users` | — (admin) | Lista de usuários |
| POST (form action) | `/users/new` | `name`, `email`, `jobTitle`, `password`, `confirmPassword` | Redirect `/users` ou `fail(400, {errors})` |
| POST (form action) | `/users/[id]/edit` (`update`) | `name`, `jobTitle`, `email?` | Redirect ou `fail(400, {errors})` |
| POST (form action) | `/users/[id]/edit` (`resetPassword`) | `password` | Redirect ou `fail(400, {errors})` |
| POST (form action) | `/users/[id]/edit` (`delete`) | — | Redirect `/users` |
| POST (form action) | `/change-password` | `currentPassword`, `password`, `confirmPassword` | Redirect `/` ou `fail(400, {errors})` |

## Alternativas consideradas

- **Flag de admin na coleção `user`** em vez de `auth`: mais "natural" semanticamente, mas impede que as API Rules nativas do PocketBase comparem `@request.auth.isAdmin` diretamente (essa comparação só enxerga campos da própria coleção de autenticação) — rejeitado, ver decisão já validada na spec de infra.
- **Bloquear acesso imediatamente ao resetar a senha** (sem os 10 dias de carência) em vez de aviso + prazo: mais simples, mas o pedido explícito foi por um período de carência com aviso antes do bloqueio — rejeitado.

## Questões em aberto

- Nenhuma no momento.

## Links

- Jira (após aprovação da spec): `docs/workflow/2026-07-09-pocketbase-user-crud.jira.md`
- Feature doc (pós-implementação): `docs/features/2026-07-09-pocketbase-user-crud.md`
- PR: `docs/workflow/2026-07-09-pocketbase-user-crud.pr.md`
- Depende de: [`pocketbase-infra`](./2026-07-09-pocketbase-infra.md), [`pocketbase-auth`](./2026-07-09-pocketbase-auth.md)
- Specs relacionadas: [`pocketbase-todo-sharing`](./2026-07-09-pocketbase-todo-sharing.md)
