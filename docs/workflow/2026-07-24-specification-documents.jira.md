# Documentos de Especificação

Created: 2026-07-24

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | Medium |
| Labels | sveltekit, ports-adapters, runes, spec-docs |
| Story Points | 8 |
| Jira Key | [JIRA-KEY] |
| Epic | _(opcional)_ |

## Description

### Contexto

Membros da equipe precisam documentar especificações técnicas/de produto, organizá-las por tags, controlar permissões de acesso e vinculá-las a tarefas do backlog global que serão votadas no Planning Poker e exportadas para o Kanban. Hoje não existe esse repositório centralizado.

### Objetivo

Sistema de documentos markdown por projeto, com permissões granulares (ver / ver e editar), tags com autocomplete, filtros, toggle de preview, criação de tasks vinculadas no backlog global que preservam o vínculo spec → task → card kanban após exportação do poker.

### Escopo

**Incluído:**
- CRUD de documentos markdown por projeto
- Editor markdown + toggle preview
- Tags livres + autocomplete
- Filtros por nome e tag
- Abas "Minhas" / "Com acesso"
- Permissões view/edit por usuário
- Link público (logado) opcional
- N tasks por documento, vinculadas via `source_spec` em `poker_tasks` e `kanban_cards`
- Lista de tasks vinculadas no documento

**Fora do escopo:**
- Compartilhamento externo (sem login)
- Histórico de versões
- Comentários
- Export PDF
- Documentos sem projeto

## Acceptance Criteria

- [ ] AC1: Participante cria documento → aparece em "Minhas especificações"
- [ ] AC2: Dono concede `edit` → usuário pode editar
- [ ] AC3: Dono concede `view` → usuário vê em modo leitura
- [ ] AC4: Usuário sem permissão acessa URL → 404
- [ ] AC5: Documento com `is_public_link = true` → qualquer logado vê (leitura)
- [ ] AC6: Toggle preview mostra/esconde markdown renderizado
- [ ] AC7: Filtro por tag → lista filtrada
- [ ] AC8: Criar task a partir do documento → `poker_tasks.source_spec` preenchido
- [ ] AC9: Exportar task para kanban → `kanban_cards.source_spec` = mesmo valor
- [ ] AC10: Documento lista tasks vinculadas com status
- [ ] AC11: Usuário com `view` tenta editar → 403
- [ ] AC12: Toggle liga/desliga link público
- [ ] AC13: Remove permissão → usuário perde acesso
- [ ] AC14: Múltiplas tasks por documento
- [ ] AC15: Excluir documento → tasks mantêm source_spec órfão
- [ ] AC16: Filtro combinado nome + tag
- [ ] AC17: Alternar abas "Minhas" / "Com acesso"
- [ ] AC18: Markdown com `<script>` → não executa
- [ ] AC19: `pnpm test` passa

## Technical Notes (Ports & Adapters — runes)

| Camada | Ação |
|--------|------|
| PocketBase | Migration cria `spec_documents` (+cascadeDelete), `spec_tags` (tabela relacional), `spec_document_permissions` (+`pair` unique text `docId:userId`). Altera `poker_tasks` e `kanban_cards` (+`source_spec`). API Rules: write = null; list/view restritas. |
| Domínio | `specAccess.ts` (funções de permissão) |
| Domínio reativo | `SpecDocument.svelte.ts` (estado + tasks vinculadas) |
| Server | `specRecord.ts` (tipos) |
| Validação | `specSchemas.ts` (Zod) |
| API | `routes/projects/[pid]/specs/+page.server.ts` (listagem) + `specs/[id]/+page.server.ts` (documento + criar task) |
| UI | `routes/projects/[pid]/specs/+page.svelte` (listagem) + `specs/[id]/+page.svelte` (editor/visualizador) + `lib/components/specs/` |
| Poker export | Atualizar `exportToKanban` action para copiar `source_spec` |
| Testes | E2E Playwright cobrindo AC1–AC19 (nota: E2E dependem de resolver bloqueador `$env` do TECH-DEBT) |

## Links

- Spec: `docs/specs/2026-07-24-specification-documents.md`
- Feature doc: `docs/features/2026-07-24-specification-documents.md`
- PR (após implementação): `docs/workflow/2026-07-24-specification-documents.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks (opcional)

- [ ] Domínio e acesso (specAccess.ts)
- [ ] Server types e validação (specRecord.ts, specSchemas.ts)
- [ ] PocketBase migrations (spec_documents, spec_tags, spec_document_permissions, +source_spec)
- [ ] API — server actions + load (listagem + documento + criar task)
- [ ] UI — listagem (abas, filtros), editor markdown + preview, permission manager, task creator
- [ ] Poker export — copiar source_spec para kanban_cards
- [ ] Testes E2E
- [ ] Documentação + PR
