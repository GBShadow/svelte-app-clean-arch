# data-testid + Correção de Testes E2E

## Contexto

Atualmente os testes e2e do app `runes` usam seletores como `getByLabel`, `getByRole`, `getByText` e
`getByPlaceholder`. Embora semânticos, esses seletores são frágeis quando:

- Há múltiplos elementos com o mesmo role/texto (ex: botões "Remover" em cada item da lista)
- O texto visível muda (ex: botão "Tornar pública" / "Tornar privada")
- A validação HTML5 (`required`) bloqueia submits de teste sem `page.evaluate()`

Além disso, a navbar do layout contém abas para `classic` (5173) e `remote` (5174) que não são mais
necessárias — ambos os apps foram movidos para `deprecated/`.

## Objetivo

Adicionar `data-testid` em kebab-case a todos os componentes e elementos interativos do app runes,
migrar todos os seletores dos testes e2e para usar `getByTestId`, remover as abas obsoletas da
navbar, e corrigir os testes de validação para usar `novalidate` em vez de `page.evaluate()`.

## Escopo

**Incluído:**

- Adicionar `data-testid` em kebab-case a todos os componentes Svelte do app runes
- Adicionar `data-testid` em elementos interativos (inputs, botões, checkboxes, links, formulários)
- Adicionar `data-testid` dinâmico para itens de lista usando o ID real do PocketBase
- Migrar todos os seletores nos 5 arquivos de teste e2e para `getByTestId`
- Adicionar `novalidate` aos formulários e remover `page.evaluate()` dos testes de validação
- Remover as abas "Classic", "Remote" e "Runes" da navbar no `+layout.svelte`
- Manter verificações de classe (`toHaveClass`) para estado `line-through` em itens marcados como
  feito, mas usando data-testid para localizar os elementos
- Manter `getByRole` dentro de containers identificados por `data-testid` para ações como "Remover"
  (abordagem container + role selector)

**Fora do escopo:**

- Alterar a lógica de comportamento/domínio dos componentes
- Adicionar novos testes e2e
- Modificar testes de unidade
- Alterar o backend (PocketBase) ou server actions
- Modificar os apps `deprecated/classic` e `deprecated/remote`

## Requisitos funcionais

- RF1: Todo formulário deve ter `data-testid` único no elemento `<form>`
- RF2: Todo input deve ter `data-testid` correspondente ao seu `name`
- RF3: Todo botão de submit/ação deve ter `data-testid` descritivo
- RF4: Toda mensagem de erro/notificação (alert) deve ter `data-testid`
- RF5: Cada item de uma lista de tarefas deve ter `data-testid="todo-item-{id}"`
- RF6: Cada checkbox de item deve ter `data-testid="checkbox-item-{id}"`
- RF7: Cada item de usuário na tabela deve ter `data-testid="user-row-{id}"`
- RF8: O link "Editar" de cada usuário deve ter `data-testid="edit-user-{id}"`
- RF9: Todo container de formulário (ex: reset-password, delete-user) deve ter `data-testid`
- RF10: O componente `UserForm` deve receber um `testId` prop para diferenciar contextos
- RF11: Todo `<form>` deve ter `novalidate` para permitir testes de validação server-side

## Convenção de nomenclatura

```
data-testid="kebab-case-com-hipens"
```

- Prefixos: `btn-`, `input-`, `select-`, `error-`, `alert-`, `nav-`, `form-`, `list-`, `item-`,
  `checkbox-`, `card-`, `msg-`, `link-`, `badge-`
- IDs dinâmicos usam o ID real do PocketBase: `data-testid="todo-item-{item.id}"`
- Componentes reutilizáveis recebem prop `testId` para diferenciar contexto

### Erros

- Erro geral (contexto): `error-{contexto}` — ex: `error-login`, `error-change-password`
- Erro de campo: `error-{field-name}` — ex: `error-email`, `error-password`, `error-title`

Os erros de campo não precisam de prefixo de contexto pois estão sempre dentro de um formulário
identificado por `data-testid`.

## Dicionário de `data-testid`

### Layout (`+layout.svelte`)

| Elemento | data-testid |
|----------|-------------|
| Link "Todo Apps" (logo) | `logo-link` |
| Link "Minhas listas" | `nav-minhas-listas` |
| Link "Usuários" | `nav-usuarios` |
| Botão "Sair" | `btn-logout` |
| Alert de mustChangePassword | `alert-change-password` |

### Login (`login/+page.svelte`)

| Elemento | data-testid |
|----------|-------------|
| Formulário de login | `login-form` |
| Input de email | `input-email` |
| Input de senha | `input-password` |
| Botão "Entrar" | `btn-login` |
| Erro geral | `error-login` |

### Change Password (`ChangePasswordForm.svelte`)

| Elemento | data-testid |
|----------|-------------|
| Formulário | `change-password-form` |
| Input senha atual | `input-current-password` |
| Input nova senha | `input-password` |
| Input confirmar senha | `input-confirm-password` |
| Botão "Trocar senha" | `btn-change-password` |
| Erro geral | `error-change-password` |
| Erro currentPassword | `error-current-password` |
| Erro password | `error-password` |
| Erro confirmPassword | `error-confirm-password` |

### User Form (`UserForm.svelte` — recebe `testId` prop)

O `testId` prop identifica o **container interno** do componente (`<div data-testid={testId}>`),
**não o formulário**. Assim o `<form>` da página pai e o `<div>` do UserForm têm IDs diferentes.

| Elemento | data-testid |
|----------|-------------|
| Container do formulário | `{testId}` |
| Input nome | `input-name` |
| Input email | `input-email` |
| Select cargo | `select-job-title` |
| Input senha (condicional) | `input-password` |
| Input confirmar senha (condicional) | `input-confirm-password` |
| Erro geral | `error-general` |
| Erros de campo | `error-{campo}` |

**Contextos:**

| Página | testId do container | testId do form |
|--------|---------------------|----------------|
| Novo usuário (`new/+page.svelte`) | `user-form-new` | `new-user-form` |
| Editar usuário (`[id]/edit/+page.svelte`) | `user-form-edit` | `edit-user-form` |

### User List (`UserList.svelte`)

| Elemento | data-testid |
|----------|-------------|
| Tabela | `users-table` |
| Linha de usuário | `user-row-{user.id}` |
| Link "Editar" | `edit-user-{user.id}` |
| Mensagem "Nenhum usuário" | `no-users-msg` |

### Users List Page (`users/+page.svelte`)

| Elemento | data-testid |
|----------|-------------|
| Link "Novo usuário" | `btn-new-user` |
| Card container | `users-list-card` |

### Edit User (`[id]/edit/+page.svelte`)

| Elemento | data-testid |
|----------|-------------|
| Formulário "Salvar" (update) | `edit-user-form` |
| UserForm container | `user-form-edit` |
| Botão "Salvar" | `btn-save-user` |
| Formulário resetar senha | `reset-password-form` |
| Botão "Resetar senha" | `btn-reset-password` |
| Sucesso reset | `reset-password-success` |
| Erro reset | `error-reset-password` |
| Formulário excluir | `delete-user-form` |
| Botão "Excluir" | `btn-delete-user` |

### New User (`new/+page.svelte`)

| Elemento | data-testid |
|----------|-------------|
| Formulário | `new-user-form` |
| UserForm container | `user-form-new` |
| Botão "Criar" | `btn-create-user` |

### Todo List (`todos/+page.svelte`)

| Elemento | data-testid |
|----------|-------------|
| Botão "Nova lista" | `btn-new-list` |
| Item de lista | `list-item-{list.id}` |
| Link da lista | `list-link-{list.id}` |
| Badge "Pública" | `list-badge-{list.id}` |
| Mensagem "Nenhuma lista" | `no-lists-msg` |

### Nova Lista (`todos/new/+page.svelte`)

| Elemento | data-testid |
|----------|-------------|
| Formulário | `new-list-form` |
| Input título | `input-title` |
| Botão "Criar" | `btn-create-list` |
| Erro geral | `error-new-list` |
| Erro título | `error-title` |

### Todo Detail (`todos/[id]/+page.svelte`)

| Elemento | data-testid |
|----------|-------------|
| Formulário updateTitle | `update-title-form` |
| Input title | `input-title` |
| Botão "Salvar título" | `btn-save-title` |
| Formulário togglePublic | `toggle-public-form` |
| Botão togglePublic | `btn-toggle-public` |
| Badge "Pública" | `list-public-badge` |
| Formulário excluir lista | `delete-list-form` |
| Botão "Excluir lista" | `btn-delete-list` |
| Card de itens | `todo-items-card` |
| Mensagem "Nenhum item" | `no-items-msg` |
| Container do item | `todo-item-{item.id}` |
| Checkbox do item | `checkbox-item-{item.id}` |
| Descrição do item | `item-desc-{item.id}` |
| Botão "Remover" | `btn-remove-item-{item.id}` |
| Formulário addItem | `add-item-form` |
| Input add item | `input-add-item` |
| Botão "Adicionar" | `btn-add-item` |
| Erro geral | `error-todo` |

## Estrutura de mudanças

### Componentes a modificar (13 arquivos):

1. `apps/runes/src/routes/+layout.svelte` — remover abas obsoletas + adicionar data-testid
2. `apps/runes/src/routes/login/+page.svelte` — adicionar data-testid + novalidate
3. `apps/runes/src/lib/components/ChangePasswordForm.svelte` — adicionar data-testid + novalidate
4. `apps/runes/src/lib/components/UserForm.svelte` — adicionar prop testId + data-testid
5. `apps/runes/src/lib/components/UserList.svelte` — adicionar data-testid dinâmico
6. `apps/runes/src/routes/users/+page.svelte` — adicionar data-testid
7. `apps/runes/src/routes/users/new/+page.svelte` — adicionar data-testid + novalidate
8. `apps/runes/src/routes/users/[id]/edit/+page.svelte` — adicionar data-testid + novalidate
9. `apps/runes/src/routes/todos/+page.svelte` — adicionar data-testid dinâmico
10. `apps/runes/src/routes/todos/new/+page.svelte` — adicionar data-testid + novalidate
11. `apps/runes/src/routes/todos/[id]/+page.svelte` — adicionar data-testid dinâmico + novalidate
12. `apps/runes/src/routes/change-password/+page.svelte` — não precisa de mudança (delega ao componente)
13. `apps/runes/src/routes/+page.svelte` — sem mudanças (só comentário)

### Testes a modificar (5 arquivos + fixture):

1. `apps/runes/e2e/fixtures.ts` — migrar login para data-testid
2. `apps/runes/e2e/auth-cross-tab.spec.ts` — migrar seletores para data-testid
3. `apps/runes/e2e/todo-sharing.spec.ts` — migrar para data-testid + novalidate
4. `apps/runes/e2e/change-password.spec.ts` — migrar para data-testid + novalidate
5. `apps/runes/e2e/user-crud.spec.ts` — migrar para data-testid + remover page.evaluate()
6. `apps/runes/e2e/todo-list-management.spec.ts` — migrar para data-testid + remover page.evaluate()

## Critérios de aceite

- [ ] AC1: Todos os componentes Svelte do app runes têm `data-testid` conforme o dicionário acima
- [ ] AC2: `UserForm` aceita prop `testId` e aplica como `data-testid` no container
- [ ] AC3: Itens de lista (tarefas, usuários) usam ID real do PocketBase nos data-testid
- [ ] AC4: Todos os formulários têm `novalidate` para permitir teste de validação server-side
- [ ] AC5: Nenhum teste e2e usa `page.evaluate()` para remover `required`
- [ ] AC6: Todos os seletores nos 5 specs + fixture usam `getByTestId`
- [ ] AC7: As abas obsoletas (Classic, Remote, Runes) foram removidas da navbar
- [ ] AC8: `pnpm exec playwright test apps/runes/e2e/ --project=chromium` passa sem falhas

## Plano de implementação

1. Modificar `+layout.svelte` — remover abas + adicionar data-testid em links e botões
2. Modificar `login/+page.svelte` — adicionar data-testid + novalidate
3. Modificar `ChangePasswordForm.svelte` — adicionar data-testid + novalidate
4. Modificar `UserForm.svelte` — adicionar prop `testId` + data-testid em inputs
5. Modificar páginas que usam `UserForm` (`new`, `edit`) — passar `testId`
6. Modificar `UserList.svelte` — adicionar data-testid dinâmico
7. Modificar `users/+page.svelte` — adicionar data-testid
8. Modificar `users/[id]/edit/+page.svelte` — adicionar data-testid + novalidate
9. Modificar `todos/+page.svelte` — adicionar data-testid dinâmico
10. Modificar `todos/new/+page.svelte` — adicionar data-testid + novalidate
11. Modificar `todos/[id]/+page.svelte` — adicionar data-testid dinâmico + novalidate
12. Atualizar `e2e/fixtures.ts` — migrar login para data-testid
13. Atualizar `e2e/auth-cross-tab.spec.ts` — migrar seletores
14. Atualizar `e2e/change-password.spec.ts` — migrar seletores + novalidate
15. Atualizar `e2e/user-crud.spec.ts` — migrar seletores + remover page.evaluate()
16. Atualizar `e2e/todo-list-management.spec.ts` — migrar seletores + remover page.evaluate()
17. Atualizar `e2e/todo-sharing.spec.ts` — migrar seletores
18. Executar testes e2e para validar

## Questões em aberto

Nenhuma — todas as decisões foram tomadas durante a entrevista.

## Links

- Spec: `docs/specs/data-testid-e2e.md`
- Feature doc (pós-implementação): `docs/features/data-testid-e2e.md`
- PR: `docs/workflow/data-testid-e2e.pr.md`
