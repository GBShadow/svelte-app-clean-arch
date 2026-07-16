# data-testid em Componentes Svelte

## Descrição

Regra para adicionar `data-testid` em kebab-case a todos os elementos interativos em componentes
Svelte, e usar `getByTestId` nos testes e2e para seletores estáveis.

## Quando usar

Sempre que criar ou modificar um componente Svelte no app `apps/runes/`.

## Passos

### 1. Nomear o data-testid

Use kebab-case com prefixos padronizados:

| Prefixo | Uso |
|---------|-----|
| `btn-` | Botões |
| `input-` | Inputs |
| `select-` | Selects |
| `checkbox-` | Checkboxes |
| `form-` | Formulários |
| `nav-` | Links de navegação |
| `link-` | Links |
| `error-` | Mensagens de erro |
| `alert-` | Alertas/notificações |
| `card-` | Cards/containers |
| `msg-` | Mensagens de estado |
| `badge-` | Badges |
| `list-` | Listas/containers de lista |
| `item-` | Itens individuais |

### 2. Elementos que DEVEM ter data-testid

- `<form>` — todos os formulários
- `<input>`, `<select>`, `<textarea>` — todos os campos
- `<button>` — todos os botões e links de ação
- `<a>` — links de navegação principais
- `<div role="alert">`, `<div role="status">` — alertas e notificações
- Containers de itens em `{#each}` — com ID dinâmico
- `<table>`, `<tr>` de listagem

### 3. IDs dinâmicos

Use o ID real do banco (PocketBase): `data-testid="todo-item-{item.id}"`

### 4. Componentes reutilizáveis

Adicione prop `testId` para diferenciar contexto:

```svelte
<script lang="ts">
  let { testId = 'default-form' }: { testId?: string } = $props();
</script>
<div data-testid={testId}>...</div>
```

### 5. Novalidate

Todo `<form>` deve ter `novalidate` para testes de validação server-side.

### 6. Testes e2e

Use `getByTestId` como seletor padrão, exceto para elementos aninhados dentro de containers:

```typescript
// Preferido
await page.getByTestId('input-email').fill('test@example.com');
await page.getByTestId('btn-login').click();

// Aceitável dentro de container
await page.getByTestId('todo-item-0').getByRole('button', { name: 'Remover' }).click();
```

## Ver também

- `.cursor/rules/architecture/data-testid.mdc` — regra Cursor equivalente
- `docs/specs/2026-07-10-data-testid-e2e.md` — spec completa com dicionário
