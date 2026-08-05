# Revisão de Design e Responsividade

Created: 2026-08-05

## Resumo

Passada completa de UI/UX + responsividade no app `runes`: remoção do container global, sistema `PageShell` + `PageHeader` com 7 larguras padronizadas, navbar mobile com perfil sempre acessível, dropdown de notificações responsivo, drawer de participantes no chat, boards full-bleed com colunas adaptativas, tabelas com overflow, e modais que não estouram em 375px. Identidade visual Dracula + sistema de acentos + fontes preservada.

## App(s) afetado(s)

runes

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| CSS | `apps/runes/src/app.css` — utilitários `page-shell-*`, `toolbar-wrap`, `board-scroll`, `modal-box-responsive` |
| HTML | `apps/runes/src/app.html` — `lang="pt-BR"` |
| Shell | `apps/runes/src/routes/+layout.svelte` — main sem container, nav mobile |
| Shell | `apps/runes/src/lib/components/NotificationBell.svelte` — largura responsiva |
| Componente | `apps/runes/src/lib/components/PageShell.svelte` — **novo** |
| Componente | `apps/runes/src/lib/components/PageHeader.svelte` — **novo** |
| Componente | `apps/runes/src/lib/components/UserList.svelte` — tabela responsiva |
| Componente | `apps/runes/src/lib/components/retro/RetroColumn.svelte`, `RetroParticipants.svelte` — responsivo |
| Componente | `apps/runes/src/lib/components/planning-poker/TaskEditor.svelte` — modal responsivo |
| Rotas | 25 `+page.svelte` — todas migradas para PageShell/PageHeader |

## Fluxo

```
PageShell (width, bleed) → página → PageHeader (título + slot de ações) → conteúdo
```

- `PageShell`: wrapper que aplica `page-shell` + `page-shell-{width}` do CSS. Substitui o antigo `container mx-auto p-4` e `max-w-* p-4` duplicados.
- `PageHeader`: header com título + descrição + slot para botões de ação. Empilha no mobile (`flex-col`), lado a lado em `sm+`.
- Utilitários CSS: `toolbar-wrap` (filtros), `board-scroll` (kanban/retro), `modal-box-responsive` (modais 375-safe).

## Como testar

```bash
pnpm dev:full          # PocketBase + runes em :5175
pnpm --filter=runes check  # 0 erros introduzidos
pnpm test              # 342 testes passando
```

Verificação visual manual nos breakpoints 375 / 768 / 1280 em todas as rotas autenticadas. Critérios: zero overflow-x, CTAs clicáveis, identidade Dracula + acentos preservada.

## Decisões de design

1. **Container removido do layout global**: boards full-bleed (kanban/retro/chat) eram incompatíveis com `container mx-auto`. Cada página agora controla sua largura via `PageShell`, com bleed explícito para superfícies densas.

2. **PageShell em vez de CSS-only**: a prop `width` no componente evita strings mágicas repetidas em 25 páginas e centraliza a tabela de larguras no CODE-STRUCTURE.

3. **Drawer de participantes no chat**: overlay fixed em `<lg`, coluna lateral em `lg+`. Preserva a experiência desktop existente sem reestruturar o layout de mensagens.

4. **Scroll horizontal interno nos boards**: colunas com largura `min(20rem, calc(100vw-2rem))` em vez de `w-80` fixo — em 375 a coluna ocupa quase toda a tela, mas o scroll horizontal navega entre colunas.

5. **Sem migração para cards em notifications/users**: tabelas com `overflow-x-auto` + colunas escondidas em mobile são suficientes para os dados atuais. Migrar para cards seria over-engineering para esta passada de CSS.
