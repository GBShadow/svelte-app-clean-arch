# Refatoração Visual Moderna da Aplicação

Created: 2026-08-27

## Resumo

Refatoração visual abrangente da aplicação no app `runes`, introduzindo uma linguagem estética contemporânea com superfícies translúcidas (*glassmorphism* com `backdrop-blur`), elevação e profundidade em camadas (*layering* com `surface-card`), microinterações e transições fluidas, escala tipográfica refinada, pílulas e badges com dots iluminados, novos estilos de *empty state* e *shimmer skeleton*, e modernização das telas principais (Hub, Categorias, Perfil, Todos, Kanban, Planning Poker, Retrospectivas e Chat em tempo real).

## App(s) afetado(s)

- `apps/runes`

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| **Design Tokens & CSS** | `apps/runes/src/app.css` (tokens de glassmorphism, surface-card, shimmer, glow e focus ring) |
| **Shell & Layout Global** | `apps/runes/src/routes/+layout.svelte`, `PageShell.svelte`, `PageHeader.svelte` |
| **Componentes de UI** | `Toast.svelte`, `NotificationBell.svelte`, `AccentPicker.svelte`, `AppCard.svelte`, `CategoryBadge.svelte`, `CategorySelect.svelte`, `CardDeck.svelte`, `RetroCard.svelte` |
| **Telas e Rotas** | `+page.svelte` (Hub), `profile/+page.svelte`, `categories/+page.svelte`, `todos/[id]/+page.svelte`, `kanban/+page.svelte`, `chat/[roomId]/+page.svelte` |

## Detalhes Visuais

1. **Superfícies & Profundidade:**
   - `.surface-glass`: Fundo translúcido (80% opacidade) com desfoque de fundo de 12px (`backdrop-filter: blur(12px)`) e borda suave.
   - `.surface-card`: Camadas elevadas com sombreamento sutil e borda de realce ao passar o cursor (`hover:border-primary/40`).
   - `.surface-elevated`: Profundidade de camada para elementos flutuantes e modais.

2. **Microinterações:**
   - Efeito `.interactive-scale` com feedback tátil de clique (`active:scale-95`).
   - Brilho de acento `.glow-accent` e transições suaves de cor.
   - Suporte completo a `prefers-reduced-motion: reduce` para acessibilidade.

3. **Componentes Modernizados:**
   - **Navbar & Notificações:** Barra superior com efeito de vidro, logo com glow e dropdowns em modalidade translúcida.
   - **Toasts:** Notificações flutuantes arredondadas (rounded-2xl) com ícones destacados em caixas de cor.
   - **Hub:** Cartões imersivos com gradiente suave no canto superior, ícones em destaque e badges de status.
   - **Quadros & Listas:** Kanban, Todos, Retrospectivas e Chat com balões arredondados, bordas de acento e alinhamento visual moderno.

## Como testar

```bash
# Executar a suíte de testes unitários
pnpm --filter runes test

# Executar aplicação em desenvolvimento
pnpm dev:runes
```

## Compatibilidade

- 100% dos seletores de automação e teste (`data-testid`) foram preservados sem alterações.
- Zero alterações em contratos de API ou coleções do PocketBase.
