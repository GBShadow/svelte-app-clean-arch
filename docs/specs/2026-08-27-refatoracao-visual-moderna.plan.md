# Refatoração Visual Moderna da Aplicação — Plano

Criado: 2026-08-27
Slug: 2026-08-27-refatoracao-visual-moderna
Spec: [docs/specs/2026-08-27-refatoracao-visual-moderna.md](./2026-08-27-refatoracao-visual-moderna.md)

> Este é o **COMO** (R1). Toda decisão de stack, arquivo, componente e estilização vive aqui — nunca na spec.

## Resumo

Refatoração abrangente da camada de apresentação do app `runes` (SvelteKit + Tailwind CSS + DaisyUI), implementando uma estética moderna com superfícies translúcidas com backdrop-filter/blur, cartões com bordas sutis e gradientes de iluminação (subtle border glows), tokens tipográficos refinados, microinterações em Tailwind/CSS, estados vazios e skeletons reutilizáveis, e atualização dos componentes de todas as ferramentas sem alterações no backend ou em seletores de teste (`data-testid`).

## Contexto técnico

| Campo | Valor |
|-------|-------|
| Linguagem / versão | SvelteKit (Svelte 5 Runes) + TypeScript |
| Dependências primárias | Tailwind CSS v4, DaisyUI v5 (Dracula base), Lucide Svelte |
| Armazenamento | PocketBase (inalterado, zero migrations) |
| Testes | Vitest (unit/dom) + Playwright (e2e) |
| Plataforma | `apps/runes` (web SPA/SSR) |
| Metas de performance | Transições ≤ 200ms, CLS < 0.1, 60fps em animações de hover/dropdown |
| Restrições | Zero quebra de `data-testid`, zero alteração de APIs/actions, respeito a `prefers-reduced-motion` |
| Escala | 25+ rotas autenticadas e 20+ componentes visuais |

## Constitution Check

| Princípio MUST | Como esta feature cumpre | Evidência |
|----------------|--------------------------|-----------|
| P-001 (Clean Arch / Ports & Adapters) | A refatoração é estritamente na camada de apresentação (UI/CSS/Componentes). Nenhuma regra de domínio ou porta é alterada. | `apps/runes/src/lib/components/` e `routes/` |
| P-002 (Svelte 5 Runes) | Todos os novos componentes ou refatorações utilizam sintaxe moderna de Runes (`$state`, `$derived`, `$props`). | Componentes Svelte 5 |
| P-006 (data-testid) | 100% dos `data-testid` existentes são preservados sem alteração de nome ou remoção. | Verificação de seletores e2e |
| P-010 (Separação Spec / Plan) | Spec agnóstica de stack; plano detalha arquivos CSS, componentes e classes Tailwind. | `docs/specs/` |

## Estrutura de código

```
apps/runes/src/
├── app.css                                   # Tokens visuais modernos, elevação, glassmorphism, skeletons e animações
├── lib/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── PageShell.svelte              # Container com suporte a elevações e padding responsivo
│   │   │   └── PageHeader.svelte             # Cabeçalho refinado com badges, ações e subtítulo
│   │   ├── ui/
│   │   │   ├── Card.svelte                   # Cartão moderno com hover glow e bordas translúcidas
│   │   │   ├── EmptyState.svelte             # Estado vazio reutilizável com ícone e CTA
│   │   │   └── Skeleton.svelte               # Placeholder pulsante com gradiente
│   │   ├── categories/
│   │   │   ├── CategoryBadge.svelte          # Badge moderno com pill translúcido e dot de cor
│   │   │   └── CategorySelect.svelte         # Seletor estilizado
│   │   ├── retro/                            # Cartões de retro e colunas refinadas
│   │   ├── planning-poker/                   # Cartas de baralho modernas e mesa de votação
│   │   ├── chat/                             # Balões de mensagem fluidos e feed estilizado
│   │   ├── AppCard.svelte                    # Cartão de app do Hub com visual imersivo
│   │   ├── AccentPicker.svelte               # Seletor de cores com feedback tátil/visual
│   │   └── Toast.svelte                      # Notificações toast com animação de slide/fade
│   └── routes/
│       ├── +layout.svelte                    # Navbar translúcida com backdrop blur
│       ├── +page.svelte                      # Hub inicial redesenhado
│       ├── categories/                       # Catálogo e visão agregada moderna
│       ├── todos/                            # Todo list com cards e checkboxes customizados
│       ├── kanban/                           # Board com colunas modernas e cartões elevados
│       ├── poker/                            # Poker room e backlog redesenhados
│       └── projects/                         # Projetos, specs e retros com acabamento polido
```

## Estados de UI

| Estado | Comportamento / componente |
|--------|---------------------------|
| Loading | Esqueletos pulsantes (`animate-pulse`) com gradiente sutil simulando o layout do conteúdo |
| Vazio | `EmptyState.svelte` com ícone suave em fundo circular, texto explicativo e botão de ação primária |
| Erro | Alerta com borda sutil em tom de erro (`text-error`, `border-error/30`, fundo translúcido) e ícone |
| Sucesso / Toast | Toasts modernos flutuantes com backdrop blur, ícone temático e barra de progresso sutil |
| Hover / Foco | Elevação suave (`hover:-translate-y-0.5`, `hover:shadow-lg`), ring de foco suave de 2px com offset |

## Decisões técnicas

| Decisão | Racional | Alternativas rejeitadas |
|---------|----------|-------------------------|
| Glassmorphism sutil (`bg-base-100/80 backdrop-blur-md`) | Cria profundidade e sofisticação sem poluição visual, mantendo alta performance em GPU. | Fundos sólidos opacos pesados ou sombras pretas duras. |
| Tokens CSS no `app.css` via `@theme` | Garante consistência global e facilidade de manutenção para bordas, sombras e transições. | Estilização inline repetitiva em cada componente. |
| Preservação de layout estrutural (PageShell/PageHeader) | Evita retrabalho nas 25 rotas e foca nos ganhos visuais de acabamento e superfícies. | Reescrita estrutural do grid de layout. |

## Memória aplicável

- `apps/runes/src/app.css` → Configuração de Tailwind v4 com `@theme` e DaisyUI v5 (tema Dracula).
- `apps/runes/src/lib/components/PageShell.svelte` → Padrão de larguras por rota (`sm`, `md`, `lg`, `xl`, `2xl`, `bleed`).
- `apps/runes/src/lib/client/accent.svelte` → Seletor de acento dinâmico (`data-accent`).
