# Client: form actions + boards realtime

## Descrição

Regra de arquitetura para o client SvelteKit: como invocar form actions via `fetch`,
como manter boards reativos sincronizados com `data` do load, e como autenticar
subscriptions PocketBase. Nascida do incidente da retro + SpecTaskCreator (2026-07-25).

## Quando usar

Ao implementar ou revisar:
- páginas com board reativo (kanban, retro, poker, chat)
- handlers que chamam form actions via `fetch` (não via `<form>`)
- componentes que listam dados vindos de `data.*` e mutam via action
- criação de entidade com lista de participantes/membros

## NÃO FAZER

1. **`fetch(window.location.href, { body: { action: '…' } })`**
   SvelteKit roteia named actions pelo query string (`?/actionName`), não pelo body.
   O campo `action` no body é irrelevante.

2. **`fetch('?/action')` + `res.json()` / ler `data.cardId` no topo**
   A resposta de form action usa serialização devalue. Sempre:
   ```ts
   import { deserialize } from '$app/forms';
   const result = deserialize(await res.text());
   // result.type === 'success' | 'failure' | …
   // result.data?.cardId
   ```
   Headers obrigatórios no `fetch` manual:
   ```ts
   headers: {
     'Content-Type': 'application/x-www-form-urlencoded',
     Accept: 'application/json',
     'x-sveltekit-action': 'true'
   }
   ```

3. **`pb.authStore.save(token, null)` para realtime**
   API Rules com `@request.auth.id` não resolvem sem o record do usuário.
   Usar `createBrowserClient(token, user)` (`$lib/client/pocketbaseClient.ts`).

4. **Board só no `onMount`, sem `$effect(() => board.sync(data…))`**
   `use:enhance` + `update()` / `invalidateAll()` recarregam `data`, mas o board
   local fica stale. Espelhar kanban: board no init + `$effect` de sync +
   `onMount(() => board.start())`.

5. **`fetch` que muta lista de `data.*` sem invalidar**
   Listas derivadas de `data` (ex.: `linkedTasks`) só mudam se o load rodar de novo.
   Preferir `<form method="POST" action="?/…" use:enhance>` com `await update()`.
   Se precisar de `fetch`, chamar `invalidateAll()` (ou `invalidate(...)`) no sucesso.

6. **Criar entidade com participantes sem incluir o criador**
   Se `createX` exige `canParticipate` e o criador não entra na lista, o responsável
   toma 403 ao usar a feature que acabou de criar. Auto-adicionar o criador.

7. **Schema da action com campo A e client enviando campo B**
   Ex.: schema `participantId`, client manda `userId` (ou o inverso) → 400 silencioso
   na UI. Alinhar nomes form ↔ Zod ↔ `formData.get`.

## FAZER (padrão de referência)

| Caso | Padrão | Exemplo no repo |
|------|--------|-----------------|
| Board + realtime | `createBrowserClient` + board no init + `$effect` sync + `start` no mount | `kanban/+page.svelte`, `retro/+page.svelte` |
| Mutation com retorno (token, id) | `fetch('?/…')` + headers + `deserialize` + opcional `invalidateAll` | `retro/+page.svelte` `postAction` |
| Lista de `data.*` | `<form use:enhance>` + `update()` | `SpecTaskCreator.svelte`, todos |
| Criação com membros | Criador entra como participante no mesmo action | `createRetro` em `retro/+page.server.ts` |

## Ver também

- `.cursor/rules/architecture/client-realtime-and-actions.mdc` — regra Cursor equivalente
- `docs/LESSONS-LEARNED.md` — entrada 2026-07-25 (incidente completo)
- `lessons-learned` — registrar novos padrões generalizáveis
- `verify-before-accept` — provar UI update no caminho real, não só no server
