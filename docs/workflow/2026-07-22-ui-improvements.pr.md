# UI improvements — accent, chat, kanban, todos, toast

## Resumo

Melhorias de UX: sistema de acentos customizáveis com 7 paletas (OKLCH), notificações toast integradas ao `use:enhance`, chat com altura total e scroll automático, modais de Kanban com scroll interno, busca por nome nos todos, e micro-interações visuais (pulse dot, tooltips, hover states).

## Tipo de mudança

- [x] Nova funcionalidade

## Alterações

### Cliente
- `apps/runes/src/lib/client/accent.svelte.ts` — Store reativa com `$state` + localStorage
- `apps/runes/src/lib/client/toast.svelte.ts` — Fila reativa de toasts (auto-dismiss 4s)
- `apps/runes/src/lib/client/enhanceWithToast.ts` — Helper `withToast()` para `use:enhance`

### UI
- `apps/runes/src/lib/components/AccentPicker.svelte` — Seletor de paleta de 7 cores
- `apps/runes/src/lib/components/Toast.svelte` — Container global de toasts
- `apps/runes/src/app.css` — 7 paletas `[data-accent="..."]` em OKLCH
- `apps/runes/src/app.html` — Inline script anti-flash para acento

### Rotas modificadas
- `+layout.svelte` — `<Toast />`
- `profile/+page.svelte` — `<AccentPicker />`
- `todos/+page.svelte` — Busca client-side por nome
- `todos/[id]/+page.svelte`, `todos/new/+page.svelte` — `withToast`
- `chat/+page.svelte` — Pulse dot de notificações
- `chat/[roomId]/+page.svelte` — Altura total, scroll, sidebar, tooltips
- `kanban/+page.svelte` — Modais com scroll interno + `withToast`
- `projects/[id]/+page.svelte` — `withToast`
- `poker/backlog/+page.svelte` — `withToast`

## Test plan

- [x] `pnpm test` — 195 unit tests, 60 todo-domain, todos passam
- [x] `pnpm check` — svelte-check limpo
- [x] `pnpm build` — build limpo
- [x] Teste manual: trocar acento em /profile, verificar persistência e anti-flash
- [x] Teste manual: criar/editar/excluir todo com toast visível
- [x] Teste manual: chat em altura total, scroll automático, pulse dot

## Documentação

- Feature: [docs/features/2026-07-22-ui-improvements.md](../features/2026-07-22-ui-improvements.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

Nenhuma.
