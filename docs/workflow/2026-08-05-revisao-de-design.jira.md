# Revisão de Design e Responsividade — Tarefas Jira

## Epic: Revisão de UI/UX e Responsividade (runes)

### 📋 RUNES-XX1 — Shell global: layout + nav + CSS

**Tipo:** Task  
**Prioridade:** Alta  
**Estimativa:** 2h

**Descrição:**
- `app.html`: `lang="pt-BR"`
- `+layout.svelte`: remover `container mx-auto p-4` do `<main>`, unificar dropdown do usuário (remover `hidden sm:block`, remover `btn-logout-mobile`), ícone User em mobile
- `NotificationBell.svelte`: `w-96` → `w-[min(24rem,calc(100vw-1rem))]`
- `app.css`: adicionar utilitários `page-shell-*`, `page-header`, `toolbar-wrap`, `board-scroll`, `modal-box-responsive`

**Critérios de aceite:**
- Navbar mostra Perfil + Sair em qualquer viewport
- Dropdown de notificações não causa overflow-x em 375
- `pnpm check` limpo para o diff do shell

---

### 📋 RUNES-XX2 — PageShell + PageHeader

**Tipo:** Task  
**Prioridade:** Alta  
**Estimativa:** 1h

**Descrição:**
- Criar `apps/runes/src/lib/components/PageShell.svelte` — wrapper com props `width`, `bleed`, `class`, `testId`
- Criar `apps/runes/src/lib/components/PageHeader.svelte` — header com `title`, `description`, `testId`, slot `children`
- Larguras: sm (login/perfil), md (todos/chat list), lg (users/poker/projects detail), xl (hub/projects list/specs list), 2xl (poker room/specs doc), full, bleed (kanban/retro/chat room)

**Critérios de aceite:**
- Componentes compilam sem erro
- Props tipadas com Svelte 5 `$props()` + `Snippet`

---

### 📋 RUNES-XX3 — Superfícies simples (auth, hub, listas, forms)

**Tipo:** Task  
**Prioridade:** Média  
**Estimativa:** 3h

**Descrição:**
Migrar para PageShell/PageHeader: login, change-password, hub, todos (list/new/detail), users (list/new/edit + UserList responsivo), profile, projects (list/new/edit), poker (list + backlog + modais), notifications, chat (list + new).

UserList: tabela com `overflow-x-auto`, coluna Cargo `hidden sm:table-cell`, email `max-w-[10rem] truncate sm:max-w-none`.

**Critérios de aceite:**
- Zero overflow-x em 375
- Headers empilham no mobile, lado a lado em sm+
- `data-testid` preservados

---

### 📋 RUNES-XX4 — Superfícies médias (project detail, specs)

**Tipo:** Task  
**Prioridade:** Média  
**Estimativa:** 1.5h

**Descrição:**
- Project detail: PageShell `lg`, toolbar-wrap, remover double-padding
- Specs list: PageShell `xl` + PageHeader, remover `min-h-screen bg-base-200`, filtros responsivos
- Specs doc: PageShell `2xl`, remover `min-h-screen bg-base-200`, editor Milkdown com `min-w-0`

**Critérios de aceite:**
- Sem double background/padding
- Filtros de specs usáveis em 375
- Editor não gera scroll-x da página

---

### 📋 RUNES-XX5 — Superfícies densas (kanban, chat room, retro, poker room)

**Tipo:** Task  
**Prioridade:** Alta  
**Estimativa:** 4h

**Descrição:**
- **Kanban**: PageShell bleed, toolbar-wrap nos filtros, colunas `w-[min(20rem,calc(100vw-2rem))]`, `max-h-[70dvh]`, `modal-box-responsive`, footer `flex-col-reverse sm:flex-row`
- **Chat room**: PageShell bleed + altura dvh, drawer de participantes em `<lg` (fixed overlay), ícone só em mobile, header wrap
- **Retro**: PageShell bleed, colunas responsivas (`RetroColumn.svelte`), bottom-bar `flex-col-reverse`, participantes `w-full sm:max-w-xs`
- **Poker room**: PageShell `2xl`, `toolbar-wrap`, `modal-box-responsive`

**Critérios de aceite:**
- Kanban: scroll horizontal só dentro do board; filtros usáveis; modal não estoura viewport
- Chat room: drawer abre/fecha com overlay; composer visível em 375
- Retro: colunas acessíveis via scroll-x; finalize visível
- Poker: deck + votação sem overflow-x

---

### 📋 RUNES-XX6 — Verificação e documentação

**Tipo:** Task  
**Prioridade:** Média  
**Estimativa:** 1h

**Descrição:**
- Rodar `pnpm --filter=runes check` (0 erros novos)
- Rodar `pnpm test` (342 testes)
- Verificar ausência de `btn-logout-mobile` em e2e
- Criar spec (`docs/specs/2026-08-05-revisao-de-design.md`)
- Criar feature doc (`docs/features/2026-08-05-revisao-de-design.md`)
- Atualizar CHANGELOG
- Atualizar CODE-STRUCTURE

**Critérios de aceite:**
- Check passa
- Testes passam
- Docs criados e atualizados
