# Tema Dracula + App Hub + correções de e2e e PocketBase (runes)

> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Redesign visual do app `runes` com o tema `dracula` do daisyUI (tipografia, ícones, cards), nova tela inicial App Hub com grid de aplicativos, centralização de layout nas telas de usuários, suíte e2e sempre headless (com diagnóstico de reuso indevido do dev server documentado) e correção de timestamps ausentes na coleção `auth` do PocketBase (com remoção da coleção `users` órfã).

## Tipo de mudança

- [x] Nova funcionalidade
- [x] Correção de bug
- [ ] Refatoração
- [x] Documentação
- [ ] Chore / tooling

## Alterações

### Domínio
- Não aplicável — sem mudança em `packages/todo-domain`.

### App(s)
- Tema/tipografia: `apps/runes/src/app.css`, `apps/runes/src/app.html`
- Ícones SVG inline: `apps/runes/src/lib/components/icons/` (novo)
- App Hub: `apps/runes/src/lib/appRegistry.ts`, `AppCard.svelte`, `AppGrid.svelte`, `+page.svelte`, `+page.server.ts`, `+layout.svelte` (novo home substitui redirect para `/todos`)
- Centralização de layout: `todos/*`, `users/*` (`mx-auto w-full max-w-*`)
- Dependência nova: `lucide-svelte` (`apps/runes/package.json`, `pnpm-lock.yaml`)
- E2E: `playwright.config.ts` (`headless: true` fixo), ajustes em `fixtures.ts`, `auth-cross-tab.spec.ts`, `change-password.spec.ts`

### Infraestrutura
- `pocketbase/pb_migrations/0009_add_timestamps_to_auth.js` (novo) — adiciona `created`/`updated` (autodate) à coleção `auth`
- `pocketbase/pb_migrations/0010_remove_default_users_collection.js` (novo) — remove a coleção `users` (auth collection padrão de fábrica, sem uso)
- Nova regra `.cursor/rules/architecture/pocketbase-collections.mdc` + `.agents/skills/pocketbase-collections.md`: toda coleção PocketBase precisa dos campos `created`/`updated`

### Testes
- Suíte e2e existente (10/10) validada como prova visual e funcional após o redesign, a mudança de home e a correção de headless
- Sem testes novos dedicados a UI (mudança visual aditiva); migrations validadas manualmente via `pnpm backend:reset`

## Test plan

- [x] `pnpm test`
- [x] `pnpm check`
- [x] `pnpm test:e2e` (10/10, headless)
- [ ] `pnpm build`
- [x] Teste manual: navegação App Hub → Todo/Usuários, telas de login/change-password/users com tema dracula em 1440px

## Documentação

- Specs: [docs/specs/app-hub.md](../specs/app-hub.md)
- Features: [docs/features/dracula-theme.md](../features/dracula-theme.md), [docs/features/app-hub.md](../features/app-hub.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

A home (`/`) deixa de redirecionar para `/todos` e passa a exibir o App Hub — links diretos para telas de todo/usuários agora partem do hub em vez da navbar.

## Issues / Jira

- Closes #[issue]
- Jira: [docs/workflow/app-hub.jira.md](./app-hub.jira.md)

## Screenshots

_(opcional — App Hub, tema dracula nas telas de login/todos/users)_
