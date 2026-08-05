# Revisão de Design e Responsividade

Created: 2026-08-05

## Contexto

O app `runes` tem várias superfícies que não foram projetadas para mobile (375px) — boards de kanban/retro com container global de padding, sidebar de chat fixa, tabelas sem overflow, dropdown de notificações com largura fixa, navegação sem acesso ao perfil em mobile, e double-padding causado pelo `container mx-auto p-4` global combinado com paddings locais. O DaisyUI Dracula + sistema de acentos é a identidade visual e deve ser preservado.

## Objetivo

Evoluir a identidade visual existente com hierarquia e espaçamento consistentes, e tornar **todas** as rotas autenticadas usáveis em viewports 375 / 768 / 1280 sem overflow horizontal, toolbars esmagadas, ou navegação quebrada.

## Escopo

**Incluído:**
- Shell global: remoção do `container mx-auto` do layout, sistema `PageShell` + `PageHeader` com larguras padronizadas por rota, navbar sempre com perfil acessível, dropdown de notificações responsivo, utilitários CSS (`page-shell-*`, `toolbar-wrap`, `board-scroll`, `modal-box-responsive`)
- Auth: login, change-password — altura dvh, inputs full-width
- Hub: grid com PageShell `xl`
- Todos: listagem, detalhe, criação — PageShell `md` + PageHeader
- Users + UserList: colunas truncadas com `hidden` em mobile, tabela com overflow-x
- Profile: avatar, push, acento em card layout
- Projects: listagem, criação, edição — PageShell + PageHeader
- Poker: listagem, backlog, room — modais responsivos, toolbar-wrap
- Notifications: filtros + tabela com overflow-x
- Chat: listagem + criação de sala — PageShell
- Project detail: PageShell `lg`, toolbar-wrap
- Specs: listagem + editor — PageShell, remoção de double-padding
- **Kanban**: board bleed, colunas responsivas (`w-[min(20rem,calc(100vw-2rem))]`), modais `modal-box-responsive`, toolbar-wrap com controls `w-full sm:w-auto`
- **Chat room**: drawer de participantes em `<lg` (fixed overlay), header com ícone só em mobile, altura dvh
- **Retro**: board bleed, colunas responsivas, bottom-bar `flex-col-reverse`
- **Poker room**: PageShell `2xl`, modais responsivos

**Fora do escopo:**
- Novas features de produto, coleções PocketBase, form actions ou regras de negócio
- Rebrand visual (cores, fontes, tema Dracula mantidos)
- Testes e2e novos de screenshot
- Correção de bugs preexistentes em testes unitários

## Impactos e Dependências

- **Features existentes afetadas:** Todas as rotas autenticadas (mudança de markup client-side apenas). Nenhuma API, load ou form action alterada.
- **Dívida técnica existente relacionada:** Nenhuma.
- **Dependências:** Nenhuma.
- **Specs relacionadas:** Nenhuma.

## Requisitos funcionais

- RF1: O layout global não deve forçar `container mx-auto` — cada página controla sua largura via `PageShell`.
- RF2: O menu de usuário deve ser acessível em qualquer viewport (Perfil + Sair visíveis).
- RF3: O dropdown de notificações não deve causar overflow-x em viewport 375.
- RF4: Todas as páginas devem usar `PageShell` com largura documentada.
- RF5: Páginas com título + ação devem usar `PageHeader`.
- RF6: Boards (kanban, retro) devem ser full-bleed com scroll horizontal interno.
- RF7: Modais devem usar `modal-box-responsive` para não estourar em 375.
- RF8: A sidebar de participantes do chat deve ser drawer/overlay em `<lg`.
- RF9: Tabelas (users, notifications) devem ter `overflow-x-auto` e colunas não-essenciais com `hidden sm:table-cell` em mobile.
- RF10: Nenhum `data-testid` existente deve ser removido ou renomeado.

## Requisitos não funcionais

- **Performance**: apenas mudanças de CSS/markup — sem regressão de runtime.
- **Acessibilidade**: foco visível preservado; drawer de chat tem backdrop clicável e `aria-label`.
- **Segurança**: sem alteração em regras de acesso, API Rules ou sanitização.

## Casos de Borda e Cenários de Erro

- **Double padding**: removido com a eliminação do `container mx-auto p-4` global e migração para `PageShell`.
- **Modal cortado em 375**: resolvido com `modal-box-responsive` (`w-[calc(100vw-1rem)] sm:w-full`).
- **Dropdown de notificações overflow**: resolvido com `w-[min(24rem,calc(100vw-1rem))]`.
- **Tabela ilegível em mobile**: colunas não-essenciais escondidas, email truncado, container com `overflow-x-auto`.
- **Sidebar de chat fixa em mobile**: substituída por overlay drawer com backdrop.

## Critérios de aceite

- [ ] AC1: Navegar em todas as rotas autenticadas em viewport 375 — zero overflow-x na página (`document.documentElement.scrollWidth <= window.innerWidth`).
- [ ] AC2: Abrir dropdown de usuário em 375 — itens Perfil e Sair visíveis e clicáveis.
- [ ] AC3: Abrir dropdown de notificações em 375 — painel não causa scroll horizontal.
- [ ] AC4: Kanban em 375 — filtros usáveis, board com scroll horizontal interno, colunas com largura adaptada.
- [ ] AC5: Chat room em 375 — drawer de participantes abre/fecha com overlay; composer visível.
- [ ] AC6: Retro em 375 — colunas acessíveis via scroll-x; bottom-bar com finalize visível.
- [ ] AC7: `pnpm --filter=runes check` passa (0 erros novos).
- [ ] AC8: `pnpm test` passa (342 testes).

## Design (Ports & Adapters)

| Camada | Mudança prevista |
|--------|-------------------|
| CSS | `apps/runes/src/app.css` — utilitários `page-shell-*`, `toolbar-wrap`, `board-scroll`, `modal-box-responsive` |
| Shell | `apps/runes/src/routes/+layout.svelte` — `main` sem container, navbar mobile com perfil, remoção `btn-logout-mobile` |
| Shell | `apps/runes/src/lib/components/NotificationBell.svelte` — largura responsiva |
| Componente | `apps/runes/src/lib/components/PageShell.svelte` — novo: wrapper de largura de página |
| Componente | `apps/runes/src/lib/components/PageHeader.svelte` — novo: header com título + slot de ações |
| Componente | `apps/runes/src/lib/components/UserList.svelte` — tabela responsiva |
| Componente | `apps/runes/src/lib/components/retro/RetroColumn.svelte` — largura responsiva |
| Componente | `apps/runes/src/lib/components/retro/RetroParticipants.svelte` — largura responsiva |
| Componente | `apps/runes/src/lib/components/planning-poker/TaskEditor.svelte` — modal responsivo |
| Rotas | Todas as `+page.svelte` — migração para `PageShell`/`PageHeader` |
| HTML | `apps/runes/src/app.html` — `lang="pt-BR"` |

## UI/UX (Estados)

| Estado | Comportamento |
|--------|---------------|
| **Mobile (375)** | Colunas de board adaptadas, tabelas com scroll, sidebar vira drawer, botões empilham |
| **Tablet (768)** | Layout intermediário com grid responsivo, drawer ainda overlay |
| **Desktop (1280)** | Layout completo com sidebar inline, grid multi-coluna, colunas com largura fixa |
| **Empty** | `.empty-state` padronizado onde aplicável |
| **Error/Toast** | Preservados; Toast `toast-end toast-bottom` já responsivo |

## Alternativas consideradas

**Container global vs. PageShell por página:** Optou-se por remover o container global e dar a cada página controle via `PageShell` porque boards full-bleed (kanban/retro/chat) são incompatíveis com `container mx-auto`. As classes utilitárias no `app.css` padronizam as larguras sem duplicar lógica.

**Drawer vs. collapse para sidebar do chat:** Optou-se por overlay drawer em `<lg` (padrão mobile nativo) porque preserva a experiência desktop existente (coluna lateral) e não requer reestruturação do layout de mensagens.

## Análise de Risco e Dívida Técnica

- **Riscos identificados:** Nenhum — mudanças são puramente de CSS/markup.
- **Dívida técnica aceita:** Nenhuma.
- **Dívida existente resolvida junto:** Nenhuma.
- **Itens registrados em `docs/TECH-DEBT.md`:** Nenhum.

## Questões em aberto

- Verificação visual em browser nos 3 breakpoints depende de instalação de Chromium no ambiente (não disponível no momento). O usuário deve validar manualmente após o deploy.

## Links

- Jira: `docs/workflow/2026-08-05-revisao-de-design.jira.md`
- Feature doc: `docs/features/2026-08-05-revisao-de-design.md`
- PR: `docs/workflow/2026-08-05-revisao-de-design.pr.md`
