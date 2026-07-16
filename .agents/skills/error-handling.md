# Catch silencioso é bug invisível

## Descrição

Regra de arquitetura: todo `catch` de uma operação best-effort (disparada sem `await` no caminho
crítico, com `.catch()` para não derrubar a requisição principal — notificação, push, rollback de
compensação) precisa logar o erro. `.catch(() => {})` nunca é aceitável.

## Por que

Caso real (Kanban, 2026-07-16): notificações de card criado/movido não apareciam. Eram três bugs
empilhados (sintaxe `IN (...)` inválida no filtro do PocketBase, campo bool `required: true`
rejeitando `false`, e autocancelação do client admin singleton cancelando requisições concorrentes
legítimas). Um único `.catch(() => {})` engolia os três, e cada hipótese testada exigia reproduzir
o bug às cegas — sem log, não dava pra distinguir "erro real" de "não havia ninguém a notificar".

## Como aplicar

Mínimo aceitável:

```ts
.catch((err) => console.error('[contexto]', err));
```

No server, prefira o helper `apps/runes/src/lib/server/logger.ts`:

```ts
import { logError } from '$lib/server/logger';
.catch((err) => logError('kanban:moveCard:push', err));
```

`context` = rota/ação + operação (`'kanban:createCard:notification'`), não só o nome da função.

No client (`.svelte`), `console.error('[contexto] ...', err)` inline é suficiente.

## O que não fazer

- `.catch(() => {})` sem nenhum log, nunca.
- Se o erro for genuinamente ruído esperado, documente o porquê num comentário — não remova o log.
- Não confiar em teste unitário (geralmente mocka a chamada) para provar que um caminho async
  best-effort funciona contra o PocketBase real — ver `verify-before-accept`.

## Ver também

- `.cursor/rules/architecture/error-handling.mdc` — regra Cursor equivalente
- `lessons-learned` — registrar o padrão geral aprendido
- `verify-before-accept` — disciplina de evidência
