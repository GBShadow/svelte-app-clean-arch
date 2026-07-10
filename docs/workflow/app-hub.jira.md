# App Hub — Tela inicial com grid de aplicativos

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | High |
| Labels | runes, sveltekit, ui, navigation |
| Story Points | 5 |
| Jira Key | [JIRA-KEY] |
| Epic | Melhorias de UX e navegação |

## Description

### Contexto

Atualmente a rota raiz `/` redireciona para `/todos`. Não existe uma tela inicial — o usuário cai direto na lista de tarefas sem visão geral. A navbar tem links diretos para cada seção, o que não escala conforme novas funcionalidades (Chat, Kanban, Planning Poker) forem adicionadas.

### Objetivo

Criar uma tela home (`/`) que funcione como hub de aplicativos: grid responsivo de cards com ícone (lucide-svelte), nome, descrição e badge de contador. A navbar é simplificada: apenas logo "❯ hub" (link para `/`) + nome do usuário + logout. Conteúdo centralizado em todas as páginas.

### Escopo

**Incluído:**
- Rota `/` exibe home screen em vez de redirecionar para `/todos`
- Sistema de registro estático de apps (`appRegistry.ts`) com `id`, `name`, `description`, `icon`, `route`, `adminOnly?`
- Componentes `AppCard.svelte` e `AppGrid.svelte` com grid responsivo (1-2-3-4 colunas)
- Saudação "Olá, {nome}!" + "Selecione um app para começar"
- Badge no card do Todo com total de itens pendentes (server load)
- Ícones via `lucide-svelte`
- Navbar simplificada: logo "❯ hub" → `/`, nome do usuário, logout
- Card de Users renderizado condicionalmente (adminOnly)
- `+page.server.ts` ajustado para carregar dados da home

**Fora do escopo:**
- Implementação de Chat, Kanban ou Planning Poker (apenas atalhos na home)
- Registro dinâmico de apps via banco
- Página inicial pública (redireciona para /login como hoje)
- Personalização por usuário (reordenar cards, favoritos)

## Acceptance Criteria

- [ ] AC1: Usuário autenticado acessa `/` e vê saudação "Olá, {nome}!" + grid com card do Todo
- [ ] AC2: Card do Todo tem ícone (lucide-svelte), nome "Tarefas" e descrição
- [ ] AC3: Ao clicar no card do Todo, redireciona para `/todos`
- [ ] AC4: Usuário não autenticado acessa `/` e é redirecionado para `/login`
- [ ] AC5: Card do Todo exibe badge com total de itens pendentes (ou 0)
- [ ] AC6: Navbar exibe apenas "❯ hub" (link para `/`), nome do usuário e botão de logout
- [ ] AC7: Ao clicar no logo "❯ hub", vai para `/`
- [ ] AC8: Grid responsivo: 1 card (mobile), 2 (tablet), 3+ (desktop)
- [ ] AC9: Admin vê card "Usuários"; usuário comum não vê
- [ ] Testes e2e cobrindo navegação home → app e acesso não autenticado
- [ ] `pnpm test` e `pnpm check` sem erros
- [ ] Documentação em `docs/features/app-hub.md`

## Technical Notes (Ports & Adapters — runes)

| Camada | Ação |
|--------|------|
| Dependência | `apps/runes/package.json` — adicionar `lucide-svelte` |
| Registro | `apps/runes/src/lib/appRegistry.ts` — array estático de `AppEntry` |
| UI (home) | `apps/runes/src/routes/+page.svelte` — substituir placeholder pela home screen |
| Server (home) | `apps/runes/src/routes/+page.server.ts` — load retorna `user` + `pendingCount` |
| Layout | `apps/runes/src/routes/+layout.svelte` — navbar com "❯ hub", remover links diretos |
| Componentes | `apps/runes/src/lib/components/AppCard.svelte` + `AppGrid.svelte` |
| Server | `apps/runes/src/lib/server/todoStore.ts` — função para contar itens pendentes |
| E2E | `apps/runes/e2e/home.spec.ts` (novo) + atualizar `fixtures.ts` se necessário |

## Links

- Spec: `docs/specs/app-hub.md`
- Feature doc (pós-implementação): `docs/features/app-hub.md`
- PR (após implementação): `docs/workflow/app-hub.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

- [ ] Adicionar dependência `lucide-svelte`
- [ ] Criar `appRegistry.ts` com interface + registro do Todo + Users
- [ ] Criar `AppCard.svelte` (card com ícone, nome, descrição, badge, hover)
- [ ] Criar `AppGrid.svelte` (grid responsivo de cards)
- [ ] Atualizar `+page.server.ts` (load com `pendingCount`)
- [ ] Atualizar `+page.svelte` (home screen com saudação + grid)
- [ ] Atualizar `+layout.svelte` (navbar "❯ hub", remover links)
- [ ] Adicionar função de contagem de itens pendentes em `todoStore.ts`
- [ ] Testes e2e + documentação
