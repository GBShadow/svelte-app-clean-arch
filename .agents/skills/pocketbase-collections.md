# Timestamps em Coleções PocketBase

## Descrição

Regra para garantir que toda coleção PocketBase (base ou auth) tenha os campos autodate `created`
e `updated`, e que coleções sem uso (como a `users` padrão de fábrica) sejam removidas.

## Quando usar

Sempre que criar ou alterar uma migration em `pocketbase/pb_migrations/`.

## Passos

### 1. Nova coleção

Inclua sempre os dois campos autodate no array `fields`:

```js
{ type: "autodate", name: "created", onCreate: true },
{ type: "autodate", name: "updated", onCreate: true, onUpdate: true },
```

### 2. Coleção já existente sem os campos

Crie uma **nova migration** (nunca edite uma migration já aplicada) usando
`collection.fields.add(new Field({...}))` e reverta com `collection.fields.removeByName(...)`
no `down`.

### 3. Coleções sem uso

Não deixe coleções órfãs (não referenciadas em migrations de regras, seeds ou código da
aplicação) no banco. Remova via migration (`app.delete(collection)`).

## Ver também

- `.cursor/rules/architecture/pocketbase-collections.mdc` — regra Cursor equivalente
- `pocketbase/pb_migrations/0008_create_todo_collections.js` — exemplo em conformidade
- `pocketbase/pb_migrations/0009_add_timestamps_to_auth.js` — exemplo de correção retroativa
- `pocketbase/pb_migrations/0010_remove_default_users_collection.js` — exemplo de remoção de coleção órfã
