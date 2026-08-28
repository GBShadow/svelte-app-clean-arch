# CRUD de Categorias e Busca Agregada

Created: 2026-08-27

## Resumo

Implementação da taxonomia e categorização global da aplicação com gestão centralizada (CRUD de categorias), visualização agregada e transversal de dados em `/categories/[id]`, e integração de vínculos e filtros locais em 5 módulos: Todos, Kanban, Planning Poker, Documentos de Especificação e Retrospectivas de Sprint.

## App(s) afetado(s)

- `apps/runes`

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| **PocketBase Migrations** | `pocketbase/pb_migrations/0024_create_categories_and_relations.js` |
| **Tipos de Servidor** | `apps/runes/src/lib/server/categoryRecord.ts`, `todoRecord.ts`, `kanbanRecord.ts`, `pokerRecord.ts`, `specRecord.ts`, `retroRecord.ts` |
| **Domínio Puro** | `apps/runes/src/lib/domain/categoryAccess.ts` e `categoryAccess.test.ts` |
| **Validação Zod** | `apps/runes/src/lib/validation/categorySchemas.ts`, `categorySchemas.test.ts`, `todoSchemas.ts`, `kanbanSchemas.ts`, `pokerSchemas.ts`, `specSchemas.ts`, `retroSchemas.ts` |
| **Componentes de UI** | `apps/runes/src/lib/components/categories/CategoryBadge.svelte`, `CategorySelect.svelte`, `RetroCard.svelte` |
| **Rotas e Form Actions** | `apps/runes/src/routes/categories/+page.server.ts`, `+page.svelte`, `apps/runes/src/routes/categories/[id]/+page.server.ts`, `+page.svelte`, `todos/[id]/`, `kanban/`, `poker/backlog/`, `projects/[projectId]/specs/`, `projects/[projectId]/sprints/[sprintId]/retro/` |
| **E2E & Testes** | `apps/runes/e2e/categories.spec.ts` |

## Fluxo (Ports & Adapters)

1. **Gestão de Categorias:** UI (`/categories`) → SvelteKit Form Actions (`?/create`, `?/update`, `?/delete`) → Schemas Zod (`categorySchemas.ts`) → PocketBase Admin Client (`categories`).
2. **Busca Agregada:** UI (`/categories/[id]`) → SvelteKit Server Load → `Promise.all` agregando em paralelo `todo_items`, `kanban_cards`, `poker_tasks`, `spec_documents` e `retro_cards` filtrados por `category = [id]` → Exibição em abas/seções com links de navegação direta.
3. **Módulos Integrados:** UI de cada ferramenta → `CategorySelect` em formulários → Validação Zod com campo opcional `category` → Persistência com `cascadeDelete: false` → `CategoryBadge` nas visualizações e filtros reativos locais.

## Rotas Adicionadas

| Rota | Descrição |
|------|-----------|
| `/categories` | Catálogo de categorias com contadores de itens associados e modais para criar, editar e excluir |
| `/categories/[id]` | Visão agregada transversal consolidando itens vinculados em todos os 5 módulos |

## Como testar

```bash
# Rodar testes unitários (Vitest)
pnpm --filter runes test

# Rodar aplicação em modo desenvolvimento
pnpm dev:runes
```

## Decisões de design

- **Escopo Global:** Categorias acessíveis a todos os usuários autenticados, proporcionando alinhamento e taxonomia consistente entre equipes e ferramentas.
- **Desvinculação Suave (Nullify):** Relacionamentos com `cascadeDelete: false`, garantindo que a exclusão de uma categoria remova apenas a etiqueta sem apagar tarefas, cartões ou documentos.
- **Consultas Paralelas:** Uso de `Promise.all` na página de agregação para tempo de resposta < 1s mesmo consolidando 5 coleções.
