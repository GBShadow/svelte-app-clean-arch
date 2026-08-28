# feat(categories): CRUD de Categorias e Busca Agregada

> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Implementação completa da taxonomia e categorização global da aplicação com gestão centralizada (CRUD de categorias), visualização agregada e transversal de dados em `/categories/[id]` e integração de vínculos e filtros locais em 5 módulos: Todos, Kanban, Planning Poker, Documentos de Especificação e Retrospectivas de Sprint.

## Tipo de mudança

- [x] Nova funcionalidade
- [ ] Correção de bug
- [ ] Refatoração
- [x] Documentação
- [ ] Chore / tooling

## Alterações

### Domínio & Validação
- `apps/runes/src/lib/domain/categoryAccess.ts` (e testes)
- `apps/runes/src/lib/validation/categorySchemas.ts` (e testes)
- `apps/runes/src/lib/server/categoryRecord.ts`

### Módulos & Integrações
- `apps/runes/src/lib/components/categories/CategoryBadge.svelte` e `CategorySelect.svelte`
- `apps/runes/src/routes/categories/+page.svelte` e `+page.server.ts`
- `apps/runes/src/routes/categories/[id]/+page.svelte` e `+page.server.ts`
- Integração de schemas e UI em Todos, Kanban, Poker, Specs e Retrospectivas

### Testes & Infra
- PocketBase migration: `pocketbase/pb_migrations/0024_create_categories_and_relations.js`
- Testes unitários (Vitest) cobrindo regras de acesso e validação Zod
- Teste E2E: `apps/runes/e2e/categories.spec.ts`

## Test plan

- [x] `pnpm test` (357 testes passando)
- [x] Teste de regressão nos 5 módulos integrados

## Documentação

- Spec: [docs/specs/2026-08-27-crud-categorias.md](../specs/2026-08-27-crud-categorias.md)
- Plan: [docs/specs/2026-08-27-crud-categorias.plan.md](../specs/2026-08-27-crud-categorias.plan.md)
- Tasks: [docs/specs/2026-08-27-crud-categorias.tasks.md](../specs/2026-08-27-crud-categorias.tasks.md)
- Feature: [docs/features/2026-08-27-crud-categorias.md](../features/2026-08-27-crud-categorias.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

Nenhuma.
