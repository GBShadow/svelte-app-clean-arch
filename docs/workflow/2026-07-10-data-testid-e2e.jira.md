# data-testid em componentes + correção de testes e2e

Created: 2026-07-10


## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | High |
| Labels | sveltekit, runes, e2e, data-testid, playwright |
| Story Points | 5 |
| Jira Key | [JIRA-KEY] |
| Epic | Qualidade de Testes |

## Description

### Contexto

Os testes e2e do app `runes` usam seletores frágeis como `getByLabel`, `getByRole`, `getByText`
e `getByPlaceholder`. Esses seletores quebram quando:

- Há múltiplos elementos com o mesmo role/texto (ex: botões "Remover" em cada item da lista)
- O texto visível muda (ex: botão "Tornar pública" / "Tornar privada")
- A validação HTML5 (`required`) bloqueia submits de teste, forçando o uso de `page.evaluate()`

Além disso, a navbar do layout ainda contém abas para `classic` (5173) e `remote` (5174) que não
são mais necessárias — ambos os apps foram movidos para `deprecated/`.

### Objetivo

Adicionar `data-testid` em kebab-case a todos os componentes e elementos interativos do app runes,
migrar todos os seletores dos testes e2e para `getByTestId`, remover as abas obsoletas da navbar,
e corrigir os testes de validação para usar `novalidate` em vez de `page.evaluate()`.

### Escopo

**Incluído:**
- Adicionar `data-testid` em kebab-case a 13 componentes Svelte do app runes
- Adicionar `data-testid` dinâmico para itens de lista usando ID real do PocketBase
- Migrar todos os seletores nos 5 arquivos de teste e2e + fixture para `getByTestId`
- Adicionar `novalidate` aos formulários e remover `page.evaluate()` dos testes
- Remover as abas "Classic", "Remote" e "Runes" da navbar no `+layout.svelte`
- Adicionar prop `testId` ao componente `UserForm` para diferenciar contextos
- Manter verificações de classe (`toHaveClass`) para estado `line-through`, mas via data-testid
- Manter `getByRole` dentro de containers identificados por `data-testid`

**Fora do escopo:**
- Alterar a lógica de comportamento/domínio dos componentes
- Adicionar novos testes e2e
- Modificar testes de unidade
- Alterar o backend (PocketBase) ou server actions
- Modificar os apps `deprecated/classic` e `deprecated/remote`

## Acceptance Criteria

- [ ] AC1: Todos os 13 componentes Svelte do app runes têm `data-testid` conforme o dicionário da spec
- [ ] AC2: `UserForm` aceita prop `testId` e aplica como `data-testid` no container, sem colidir com o data-testid do formulário pai
- [ ] AC3: Itens de lista (tarefas, usuários) usam ID real do PocketBase nos data-testid
- [ ] AC4: Todos os formulários têm `novalidate` para teste de validação server-side
- [ ] AC5: Nenhum teste e2e usa `page.evaluate()` para remover `required`
- [ ] AC6: Todos os seletores nos 5 specs + fixture usam `getByTestId`
- [ ] AC7: As abas obsoletas (Classic, Remote, Runes) foram removidas da navbar
- [ ] AC8: `pnpm exec playwright test apps/runes/e2e/ --project=chromium` passa sem falhas
- [ ] Documentação em `docs/features/2026-07-10-data-testid-e2e.md`

## Technical Notes

| Camada | Ação | Arquivos |
|--------|------|----------|
| Layout | Remover abas obsoletas + data-testid | `+layout.svelte` |
| UI (componentes) | Adicionar data-testid + prop testId | `ChangePasswordForm.svelte`, `UserForm.svelte`, `UserList.svelte` |
| UI (páginas) | Adicionar data-testid + novalidate | `login/+page.svelte`, `change-password/+page.svelte`, `users/*`, `todos/*` (total 9 páginas) |
| Testes e2e | Migrar seletores para getByTestId | `fixtures.ts`, 5 spec files em `e2e/` |

## Dicionário resumido de data-testid

A spec completa (`docs/specs/2026-07-10-data-testid-e2e.md`) contém o dicionário completo. Os principais
grupos:

| Grupo | Exemplos |
|-------|----------|
| Layout | `logo-link`, `nav-minhas-listas`, `nav-usuarios`, `btn-logout`, `alert-change-password` |
| Login | `login-form`, `input-email`, `input-password`, `btn-login`, `error-login` |
| Change Password | `change-password-form`, `btn-change-password`, `error-change-password` |
| User Form | `{testId}`, `input-name`, `input-email`, `select-job-title` |
| Users CRUD | `users-table`, `new-user-form`, `edit-user-form`, `btn-create-user`, `btn-save-user` |
| Todo List | `new-list-form`, `list-item-{id}`, `btn-new-list`, `no-lists-msg` |
| Todo Detail | `todo-item-{id}`, `checkbox-item-{id}`, `add-item-form`, `btn-delete-list` |

## Plano de implementação

1. Modificar `+layout.svelte` — remover abas + adicionar data-testid
2. Modificar `login/+page.svelte` — data-testid + novalidate
3. Modificar `ChangePasswordForm.svelte` — data-testid + novalidate
4. Modificar `UserForm.svelte` — prop `testId` + data-testid
5. Modificar páginas que usam `UserForm` — passar `testId`
6. Modificar `UserList.svelte` — data-testid dinâmico
7. Modificar `users/+page.svelte` — data-testid
8. Modificar `users/[id]/edit/+page.svelte` — data-testid + novalidate
9. Modificar `todos/+page.svelte` — data-testid dinâmico
10. Modificar `todos/new/+page.svelte` — data-testid + novalidate
11. Modificar `todos/[id]/+page.svelte` — data-testid + novalidate
12. Atualizar `e2e/fixtures.ts` — migrar login para data-testid
13. Atualizar 5 spec files e2e — migrar seletores + remover page.evaluate()
14. Executar `pnpm exec playwright test apps/runes/e2e/ --project=chromium` para validar

## Links

- Spec: `docs/specs/2026-07-10-data-testid-e2e.md`
- Feature doc: `docs/features/2026-07-10-data-testid-e2e.md`
- PR (após implementação): `docs/workflow/data-testid-e2e.pr.md`
- Regra Cursor: `.cursor/rules/architecture/data-testid.mdc`
- Skill Freebuff: `.agents/skills/data-testid.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

- [ ] Componentes — adicionar data-testid + novalidate + prop testId (13 arquivos)
- [ ] Testes e2e — migrar seletores + remover page.evaluate() (5 specs + fixture)
- [ ] Layout — remover abas obsoletas
- [ ] Validar — rodar testes e2e e corrigir falhas
- [ ] Documentação — feature doc + PR
