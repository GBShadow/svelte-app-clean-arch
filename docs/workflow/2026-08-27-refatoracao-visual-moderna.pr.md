# refactor(ui): Refatoração Visual Moderna da Aplicação

> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Refatoração visual e modernização estética de todas as superfícies da aplicação no app `runes`, estabelecendo uma linguagem visual com superfícies translúcidas (*glassmorphism* com `backdrop-blur`), camadas de profundidade (*layering* com `surface-card`), microinterações fluidas em botões e seletores, badges em pílula com dots de status, novo sistema de empty states e skeletons, e polimento nos módulos centrais (Hub, Categorias, Perfil, Todos, Kanban, Poker e Chat).

## Tipo de mudança

- [ ] Nova funcionalidade
- [ ] Correção de bug
- [x] Refatoração
- [x] Documentação
- [ ] Chore / tooling

## Alterações

### Design Tokens & Estilos
- `apps/runes/src/app.css`: Classes utilitárias `.surface-glass`, `.surface-card`, `.surface-elevated`, `.glow-accent`, `.interactive-scale` e `.skeleton-modern`.

### Shell & Layout
- `apps/runes/src/routes/+layout.svelte`: Barra de navegação superior com acabamento de vidro, logo refinado e dropdown de perfil moderno.
- `apps/runes/src/lib/components/NotificationBell.svelte`: Sino e painel de notificações com transições suaves.

### Componentes de UI
- `apps/runes/src/lib/components/Toast.svelte`: Toasts flutuantes com backdrop blur e caixas de ícone temáticas.
- `apps/runes/src/lib/components/AccentPicker.svelte`: Microinterações de escala e anéis de seleção ativos.
- `apps/runes/src/lib/components/categories/CategoryBadge.svelte` e `CategorySelect.svelte`: Pílulas arredondadas com dot indicador.
- `apps/runes/src/lib/components/AppCard.svelte`: Cartões imersivos com gradiente e elevação ao hover.
- `apps/runes/src/lib/components/planning-poker/CardDeck.svelte`: Cartas de Poker com elevação e brilho.
- `apps/runes/src/lib/components/retro/RetroCard.svelte`: Cartões de retro com hover refinado.

### Telas
- `apps/runes/src/routes/+page.svelte` (Hub)
- `apps/runes/src/routes/profile/+page.svelte` (Perfil)
- `apps/runes/src/routes/categories/+page.svelte` (Categorias)
- `apps/runes/src/routes/todos/[id]/+page.svelte` (Todos)
- `apps/runes/src/routes/kanban/+page.svelte` (Kanban)
- `apps/runes/src/routes/chat/[roomId]/+page.svelte` (Chat)

## Test plan

- [x] `pnpm test` (357 testes passando em 41 suítes do runes + 60 testes no todo-domain)
- [x] Verificação de integridade de 100% dos seletores `data-testid`

## Documentação

- Spec: [docs/specs/2026-08-27-refatoracao-visual-moderna.md](../specs/2026-08-27-refatoracao-visual-moderna.md)
- Plan: [docs/specs/2026-08-27-refatoracao-visual-moderna.plan.md](../specs/2026-08-27-refatoracao-visual-moderna.plan.md)
- Tasks: [docs/specs/2026-08-27-refatoracao-visual-moderna.tasks.md](../specs/2026-08-27-refatoracao-visual-moderna.tasks.md)
- Feature: [docs/features/2026-08-27-refatoracao-visual-moderna.md](../features/2026-08-27-refatoracao-visual-moderna.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

Nenhuma.
