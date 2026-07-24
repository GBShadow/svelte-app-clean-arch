# UI Improvements — Accent, Toast, Chat, Kanban, Todos

Created: 2026-07-22

## Resumo

Melhorias de experiência do usuário: sistema de acentos customizáveis (7 paletas), notificações toast para feedback de ações, redesenho do chat com altura total e scroll automático, modais de Kanban com scroll interno, busca por nome na listagem de todos, e micro-interações visuais (pulse dot, tooltips, hover states).

## App(s) afetado(s)

runes

## Arquivos Criados/Modificados

### Cliente
- `apps/runes/src/lib/client/accent.svelte.ts` — Store reativa de acento (`$state` + `localStorage`)
- `apps/runes/src/lib/client/toast.svelte.ts` — Store reativa de toasts (fila FIFO, auto-dismiss 4s)
- `apps/runes/src/lib/client/enhanceWithToast.ts` — Helper `withToast()` para integrar toast ao `use:enhance`

### UI
- `apps/runes/src/lib/components/AccentPicker.svelte` — Seletor de paleta (7 círculos de cor, `aria-pressed`)
- `apps/runes/src/lib/components/Toast.svelte` — Container de toasts (DaisyUI `alert` + ícones lucide)
- `apps/runes/src/lib/components/chat/NewMessageIndicator.svelte` — Indicador pulse dot

### CSS
- `apps/runes/src/app.css` — 7 paletas de acento (`[data-accent="magenta"]` etc.) com `primary`/`secondary`/`accent` em OKLCH
- `apps/runes/src/app.html` — Inline script para restaurar acento sem flash (antes da hidratação)

### Rotas modificadas
- `apps/runes/src/routes/+layout.svelte` — `<Toast />` global + link para `/profile` no menu
- `apps/runes/src/routes/profile/+page.svelte` — `<AccentPicker />` na página de perfil
- `apps/runes/src/routes/todos/+page.svelte` — Input de busca (`$state` + `$derived`)
- `apps/runes/src/routes/todos/[id]/+page.svelte` — Cards maiores com hover, botão voltar com tooltip, `withToast` em todas as actions
- `apps/runes/src/routes/todos/new/+page.svelte` — `withToast`
- `apps/runes/src/routes/chat/+page.svelte` — Pulse dot indicando mensagens não lidas
- `apps/runes/src/routes/chat/[roomId]/+page.svelte` — Altura total (`h-dvh`), scroll automático, botão "ir para o fim", sidebar de participantes, botão voltar com tooltip
- `apps/runes/src/routes/kanban/+page.svelte` — 3 modais com scroll interno (`overflow-y-auto`) e botões fixos no final, altura 95vh, `withToast`
- `apps/runes/src/routes/projects/[id]/+page.svelte` — `withToast` em todas as actions
- `apps/runes/src/routes/poker/backlog/+page.svelte` — `withToast`

## Detalhamento por Feature

### Sistema de Acentos
- Store `accent.svelte.ts`: classe com `$state`, persiste em `localStorage`, aplica `data-accent` no `<html>` via `accent.set()`
- Anti-flash: script inline em `app.html` lê `localStorage` antes da hidratação do SvelteKit
- 7 paletas: magenta, roxo, ciano, verde, âmbar, rosa, azul — cada uma com `--color-primary`, `--color-secondary`, `--color-accent` e respectivos `-content` em OKLCH

### Toast Notifications
- `toast.svelte.ts`: fila reativa com auto-dismiss (4s), IDs via `crypto.randomUUID()`
- `Toast.svelte`: DaisyUI `alert` (success/error) com ícone `lucide-svelte` + botão de fechar
- `enhanceWithToast.ts`: wrapper para `use:enhance` que exibe toast em sucesso ou erro automaticamente
- Usado em: todos/*, kanban, projects/*, poker/backlog (exceto chat mensagens)

### Chat
- Altura total da tela: `h-dvh` no container principal
- Scroll automático: `scrollTo()` no final da lista ao receber mensagem
- Botão "ir para o fim": visível quando scroll não está no final
- Sidebar de participantes: coluna lateral no `lg+`
- Botão voltar com tooltip: navegação para `/chat`
- Pulse dot na home (`/chat`): `NewMessageIndicator.svelte` com animação CSS

### Kanban
- Modais de card, coluna e confirmação com scroll interno (`overflow-y-auto max-h-[calc(95vh-*)]`)
- Botões fixos no final do modal (cancelar/salvar)
- Altura geral reduzida para 95vh

### Todos
- Input de busca na listagem: `$state` + `$derived` filtra por nome da lista
- Cards maiores: `p-4` → `p-6`, hover com `border-accent`
- Botão voltar com tooltip no detalhe (`/todos/[id]`)

### Outros
- Avatar: prop `size` para tamanho dinâmico (não mais fixo)
- NotificationBell: pulse removido (era confundido com notificações não lidas reais)
- Label spacing: `gap: 0.75rem` entre label e input no CSS global
- Botões destrutivos padronizados: `btn-outline btn-error` em exclusões
- Pulse dot no chat home: `NewMessageIndicator.svelte`
- `withToast` integrado em kanban, todos, projects e poker

## Fluxo

### Toast
```
use:enhance={withToast({ successMessage: '...' })}
    → submit → result.type === 'failure' → toastStore.add(error, 'error')
             → result.type === 'success|redirect' → toastStore.add(successMessage, 'success')
    → Toast.svelte (global em +layout) renderiza fila
```

### Acento
```
AccentPicker → accent.set(name) → localStorage + document.documentElement.dataset.accent
    → app.css: [data-accent="..."] → --color-primary, --color-secondary, --color-accent
```

## Como testar

```bash
pnpm test       # 195 testes unitários (runes) + 60 (todo-domain)
pnpm check      # svelte-check
pnpm dev:runes  # verificar visualmente
```

## Decisões de design

1. **Toast via wrapper `use:enhance` em vez de store global imperativa**: o padrão `use:enhance` com `withToast()` mantém a origem da notificação perto do formulário e evita acoplamento direto nas server actions. A store `toast.svelte.ts` fica como mecanismo — o `withToast` é a API pública.
2. **Acento como `data-*` attribute em vez de CSS custom properties globais**: `data-accent` no `<html>` permite que o CSS selecione a paleta inteira (primary, secondary, accent) de uma vez sem JS runtime. O inline script em `app.html` previne flash de cor.
3. **OKLCH para cores**: espaço de cor perceptualmente uniforme, mais adequado para paletas geradas do que HSL/HEX.
4. **`h-dvh` no chat**: `dvh` (dynamic viewport height) evita problemas com barras de ferramentas mobile que o `vh` tradicional não cobre.
5. **Sem toast em mensagens de chat**: mensagens usam subscription realtime — não há form action síncrona que justifique toast; o feedback é visual (a mensagem aparece na lista).
6. **Busca de todos client-side (`$state` + `$derived`)**: como a listagem já está carregada no load e é pequena (dezenas de listas por usuário), filtrar client-side é mais rápido que uma requisição adicional. Em escala maior, migrar para query param + server-side filtering.
