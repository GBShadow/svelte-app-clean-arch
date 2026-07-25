# Documentos de Especificação

Created: 2026-07-24

## Contexto

Durante o desenvolvimento, membros da equipe precisam documentar especificações técnicas e de produto em formato rico, organizá-las por tags, controlar quem pode vê-las ou editá-las, e associá-las a tarefas do backlog global que posteriormente serão votadas no Planning Poker e exportadas para o Kanban. Hoje não existe um repositório centralizado de documentos com permissões granulares e vinculação a tasks.

## Objetivo

Um sistema de documentos de especificação markdown por projeto, com controle de permissões por usuário (ver / ver e editar), tags com autocomplete, filtros, toggle de preview, e criação vinculada de tasks no backlog global que preservam o vínculo mesmo após exportação para o kanban.

## Escopo

**Incluído:**
- Criação, edição e exclusão de documentos markdown dentro de um projeto
- Editor de texto markdown com toggle de preview (mostrar/esconder)
- Tags via tabela de relação `spec_tags` (document, tag) — autocomplete baseado em tags já usadas no projeto, filtro via PocketBase
- Filtros por nome (texto) e por tag (múltipla seleção, server-side via `spec_tags`)
- Duas abas na listagem: "Minhas especificações" (criadas por mim) e "Com acesso" (documentos de outros que tenho permissão para ver/editar)
- Permissões por documento: dono pode conceder `view` (ver) ou `edit` (ver + editar) a qualquer usuário do sistema (nunca `delete` — só o dono exclui)
- Tornar documento acessível por link (logado): qualquer usuário autenticado com o link direto pode ver, sem precisar de permissão explícita
- Criação de task no backlog global a partir do documento:
  - Formulário com título + descrição (não preenche automaticamente com conteúdo do documento)
  - Task vinculada ao documento via `source_spec` em `poker_tasks`
  - Ao exportar a task para o kanban (via Planning Poker), o campo `source_spec` é copiado para `kanban_cards.source_spec`
  - N tasks por documento (múltiplas tasks podem ser criadas a partir da mesma spec)
  - Na tela do documento, lista de tasks vinculadas (com status: backlog, voting, estimated, exported)
- Lista de participantes com permissão exibida na tela do documento (quem pode ver/editar)
- App hub entry: ícone `FileText` (lucide-svelte), rota `/projects/[id]/specs`, `adminOnly: false`

**Fora do escopo:**
- Compartilhamento externo (sem login)
- Histórico de versões do documento (apenas o estado atual)
- Comentários/discussão no documento
- Exportar documento para PDF ou outro formato
- Documentos sem projeto (sempre ligados a um projeto)
- Templates de documento

## Impactos e Dependências

- **Features existentes afetadas:**
  - `poker_tasks`: novo campo `source_spec` (→ `spec_documents`, nullable)
  - `kanban_cards`: novo campo `source_spec` (→ `spec_documents`, nullable)
  - Planning Poker — export action precisa copiar `source_spec` da task para o card
  - Backlog global — listagem pode exibir badge "vinculado a spec"
- **Dívida técnica existente relacionada:** Nenhum item em `docs/TECH-DEBT.md` afeta esta área.
- **Dependências:** Precisa do Planning Poker e Kanban já implementados (ambos existentes).
- **Specs relacionadas:** `2026-07-12-planning-poker.md`, `2026-07-12-kanban.md`

## Requisitos funcionais

- RF1: O sistema deve permitir que qualquer participante de um projeto crie um documento de especificação.
- RF2: O sistema deve permitir que o dono (criador) edite e exclua seus próprios documentos.
- RF3: O sistema deve permitir que o dono conceda permissão `view` ou `edit` a qualquer usuário.
- RF4: O sistema deve permitir que o dono torne o documento acessível por link (logado), sem necessidade de permissão explícita.
- RF5: O sistema deve permitir que o dono remova acessibilidade por link a qualquer momento.
- RF6: O sistema deve exibir na listagem duas abas: "Minhas especificações" e "Com acesso".
- RF7: O sistema deve permitir filtrar documentos por nome (busca textual) e por tags (múltipla seleção).
- RF8: O sistema deve oferecer autocomplete de tags baseado em tags já usadas no projeto.
- RF9: Ao criar/editar um documento, o editor markdown deve ter um toggle para mostrar/esconder o preview renderizado.
- RF10: O sistema deve permitir criar uma task no backlog global a partir do documento, com formulário de título + descrição.
- RF11: A task criada deve ter o campo `source_spec` preenchido com o ID do documento.
- RF12: Ao exportar a task para o kanban (via Planning Poker), o campo `source_spec` deve ser copiado para `kanban_cards.source_spec`.
- RF13: A tela do documento deve listar todas as tasks vinculadas, com status atual (backlog, voting, estimated, exported).
- RF14: O sistema deve permitir criar N tasks a partir do mesmo documento.
- RF15: O sistema deve bloquear qualquer ação de escrita de usuário que tenha permissão apenas `view` no documento.
- RF-TDD: Todo código de produção deve ser precedido pelo teste que o exige (Red-Green-Refactor).

## Requisitos não funcionais

- **Segurança**:
  - XSS: o conteúdo markdown é renderizado com `svelte-markdown` (que já trata HTML inline de forma segura). Sanitização dupla: server-side ao salvar (via `sanitize-html` allowlist) + client-side ao renderizar via `svelte-markdown`. AC específico: "Dado markdown com `<script>alert(1)</script>`, quando renderizado, então o script não é executado."
  - IDOR: toda rota de documento verifica: (a) dono, (b) permissão explícita (`view`/`edit`), ou (c) `is_public_link = true` (para view apenas). Qualquer acesso sem uma das três condições retorna 404 (não 403, para não revelar existência).
  - Link público: o `is_public_link` é um boolean. Quem tem o link e está logado consegue ver. Não há token de link — o ID do documento é o segredo. Se necessário maior segurança no futuro, pode-se adicionar token de compartilhamento.
  - API Rules PocketBase: write rules = null (tudo via admin client). `spec_documents`: `listRule`/`viewRule` = autenticado com filtro server-side por participação/permissão. `spec_document_permissions`: `listRule`/`viewRule` = `document.created_by.id = @request.auth.id` (só dono vê permissões); write rules = null.
- **Realtime**: atualização do documento — não essencial (sem colaboração síncrona prevista). Pode ser implementado com salvamento manual ou auto-save com debounce.
- **Performance**: documentos podem conter muito markdown. O toggle de preview renderiza sob demanda; sem impacto no load inicial.
- **Testes**: E2E Playwright cobrindo criação, permissões, filtros, criação de task e vínculo pós-export.

## Casos de Borda e Cenários de Erro

- **Concorrência:** dois usuários com permissão `edit` salvam o mesmo documento simultaneamente — o último write vence. Sem resolução de conflitos (aceito).
- **Timeout / falha de rede:** auto-save falha silenciosamente; toast de erro com opção "Tentar novamente". Último estado do editor preservado no client.
- **Estado vazio (sem documentos):** mensagem "Nenhuma especificação encontrada" + CTA "Criar primeira especificação".
- **Filtro sem resultados:** "Nenhum documento corresponde aos filtros".
- **Permissão negada:** acesso direto a URL de documento sem permissão → 404 (não revela existência).
- **Task vinculada, documento excluído:** tasks/kanban cards mantêm `source_spec` mesmo se o documento for excluído (referência órfã). A UI exibe "Documento removido" ao tentar acessar o link.
- **Sessão expirada:** redireciona para /login (padrão).
- **Markdown malicioso:** sanitização server-side + client-side; tags HTML/script escapadas.

## Critérios de aceite

- [ ] AC1: Dado um projeto, quando um participante cria um documento, então o documento aparece na aba "Minhas especificações".
- [ ] AC2: Dado um documento com permissão `edit` concedida a outro usuário, quando esse outro acessa o documento, então pode editar o markdown.
- [ ] AC3: Dado um documento com permissão `view` concedida a outro usuário, quando esse outro acessa o documento, então vê o conteúdo em modo leitura (sem editor).
- [ ] AC4: Dado um usuário sem permissão, quando acessa a URL direta do documento (não público), então recebe 404.
- [ ] AC5: Dado um documento com `is_public_link = true`, quando qualquer usuário logado acessa a URL, então vê o documento em modo leitura.
- [ ] AC6: Dado o editor markdown com toggle habilitado, quando o usuário clica no toggle, então o preview aparece/desaparece.
- [ ] AC7: Dado um filtro por tag, quando o usuário seleciona uma tag, então a listagem exibe apenas documentos com aquela tag.
- [ ] AC8: Dado um documento, quando o dono cria uma task do backlog global a partir dele, então `poker_tasks.source_spec` = `document.id`.
- [ ] AC9: Dada uma task com `source_spec` exportada para o kanban, então `kanban_cards.source_spec` = mesmo valor.
- [ ] AC10: Dado um documento com tasks vinculadas, quando visualizado, então a lista de tasks é exibida com status.
- [ ] AC11: Dado um documento com permissão `view` concedida a outro usuário, quando esse outro tenta enviar o formulário de edição, então a ação é rejeitada (403).
- [ ] AC12: Dado um documento com `is_public_link = true`, quando o dono desliga o toggle, então o link público deixa de funcionar (usuário sem permissão recebe 404).
- [ ] AC13: Dado um documento com permissões, quando o dono remove uma permissão, então o usuário perde acesso imediatamente.
- [ ] AC14: Dado um documento, quando o dono cria uma segunda task a partir dele, então ambas as tasks aparecem na lista de tasks vinculadas.
- [ ] AC15: Dado um documento com tasks vinculadas, quando o dono exclui o documento, então as tasks existentes mantêm `source_spec` (referência órfã) e a UI exibe "Documento removido".
- [ ] AC16: Dado o filtro de nome + tag, quando o usuário preenche ambos, então a listagem exibe apenas documentos que correspondem a ambos os critérios.
- [ ] AC17: Dada a listagem com abas, quando o usuário alterna de "Minhas especificações" para "Com acesso", então a lista é recarregada com os documentos corretos.
- [ ] AC18: Dado markdown com `<script>alert(1)</script>`, quando renderizado no preview, então o script não é executado.
- [ ] AC19: Testes unitários puros escritos antes da implementação (TDD): (`specAccess.test.ts`) e E2E Playwright cobrindo os cenários acima.
- [ ] AC20: `pnpm test` passa antes da abertura do PR.

## Design (Ports & Adapters)

| Camada | Mudança prevista |
|--------|-------------------|
| PocketBase | Migration cria `spec_documents` (`project` ->projects cascadeDelete, `title` text, `body_md` text, `created_by` ->user, `is_public_link` bool default false), `spec_tags` (`document` ->spec_documents cascadeDelete, `tag` text — filtro por tag via coleção relacional), e `spec_document_permissions` (`document` ->spec_documents cascadeDelete, `user` ->user, `role` view\|edit, `pair` text unique — string `docId:userId`). Migration altera `poker_tasks` (+`source_spec` ->spec_documents nullable) e `kanban_cards` (+`source_spec` ->spec_documents nullable). API Rules: write rules = null (admin client). `spec_documents`: `listRule`/`viewRule` = `@request.auth.id != ''` (filtragem real via server no load). `spec_document_permissions`: `listRule`/`viewRule` = `document.created_by.id = @request.auth.id`; write = null. `created`/`updated` autodate. |
| Domínio (função pura) | `apps/runes/src/lib/domain/specAccess.ts` — `canViewDocument(user, doc, permissions)`, `canEditDocument(user, doc, permissions)`, `canDeleteDocument(user, doc)`, `canManagePermissions(user, doc)` (só dono), `filterDocumentsByAccess(user, docs, permissions)` (usada server-side no load) |
| Domínio reativo (client) | `apps/runes/src/lib/domain/SpecDocument.svelte.ts` — estado do documento atual, lista de tasks vinculadas, se aplicável |
| Server (types) | `apps/runes/src/lib/server/specRecord.ts` — `SpecDocumentRecord`, `SpecDocumentPermissionRecord` + extensões em `pokerRecord.ts`/`kanbanRecord.ts` |
| Validação | `apps/runes/src/lib/validation/specSchemas.ts` — Zod schemas para create, update, permission, createTask, filtros |
| API | `apps/runes/src/routes/projects/[projectId]/specs/+page.server.ts` (listagem + ações de lista) e `specs/[docId]/+page.server.ts` (documento individual + criar task) + actions CRUD |
| UI | `apps/runes/src/routes/projects/[projectId]/specs/+page.svelte` (listagem com abas, filtros) + `specs/[docId]/+page.svelte` (editor markdown + toggle preview + tasks vinculadas) + `lib/components/specs/` (markdown editor, permission manager, task creator modal) |
| Markdown render | `svelte-markdown` para renderização no preview + `sanitize-html` server-side ao salvar (`apps/runes/src/lib/server/richTextSanitize.ts`, mesma allowlist do kanban) |

## UI/UX (Estados)

| Estado | Comportamento / Componente |
|--------|---------------------------|
| **Loading (lista)** | Skeleton de linhas da tabela/cards |
| **Empty (minhas)** | "Você ainda não criou nenhuma especificação" + botão "Criar" |
| **Empty (acesso)** | "Nenhum documento compartilhado com você ainda" |
| **Filtro sem resultado** | "Nenhum documento corresponde aos filtros" |
| **Editor — markdown** | Textarea para markdown + toggle "Preview" |
| **Editor — preview** | Markdown renderizado (modo leitura) |
| **Permissão view** | Apenas preview; editor desabilitado |
| **Error** | Toast de erro padrão |
| **Success** | Toast "Documento salvo" / "Task criada" |
| **Offline** | Badge "Sem conexão" + desabilitar botão de salvar; último estado preservado |

## Contrato de API

Todas as mutações via form actions.

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| POST | `/projects/{pid}/specs?/create` | `title, body_md, tags[]` | `redirect(303, /projects/{pid}/specs/{id})` |
| POST | `/projects/{pid}/specs/{id}?/update` | `title, body_md, tags[]` | `{ success: true }` |
| POST | `/projects/{pid}/specs/{id}?/delete` | — | `redirect(303, /projects/{pid}/specs)` |
| POST | `/projects/{pid}/specs/{id}?/togglePublic` | — | sucesso (is_public_link = !is_public_link) |
| POST | `/projects/{pid}/specs/{id}?/addPermission` | `userId, role` (view\|edit) | sucesso |
| POST | `/projects/{pid}/specs/{id}?/removePermission` | `userId` | sucesso |
| POST | `/projects/{pid}/specs/{id}?/createTask` | `title, description` | `json({ taskId })` |
| GET | `/projects/{pid}/specs` | `?q=&tags=&tab=mine\|shared` | PageData |

## Alternativas consideradas

- **Rich text (Tiptap) vs. Markdown:** Optou-se por markdown pela portabilidade e familiaridade; toggle de preview permite ver o resultado sem sair do editor.
- **Token de link público vs. `is_public_link` boolean:** O boolean + ID como segredo é a abordagem mais simples. Se no futuro houver necessidade de links mais seguros, adiciona-se token. Decidiu-se por não complicar o MVP.
- **Vínculo via tabela separada vs. campo direto:** Campo `source_spec` direto em `poker_tasks` e `kanban_cards` é mais simples e performático para consulta; atende ao requisito de N tasks por spec sem complexidade extra.
- **Tags JSON vs. tabela relacional `spec_tags`:** JSON `tags[]` é mais simples mas PocketBase não filtra dentro de arrays JSON. Optou-se por tabela relacional `spec_tags` para permitir filtro server-side via PocketBase desde o início.
- **Unique pair (document, user):** PocketBase não suporta unique composto nativo. Criou-se campo `pair` = `docId:userId` com `unique: true` no PocketBase + verificação server-side (`getFirstListItem` antes de insert).

## Análise de Risco e Dívida Técnica

- **Riscos identificados:**
  - ID do documento como segredo para "link público": se alguém obtém um ID de documento público, consegue acessar. Risco baixo porque IDs são UUIDs não sequenciais e o acesso exige autenticação.
  - Concorrência de edição: dois usuários editando simultaneamente — último write vence. Aceito como trade-off (não é editor colaborativo síncrono).
  - Bloqueador conhecido: testes E2E Playwright falham com `$env` (ver `docs/TECH-DEBT.md`). Até resolver, cobertura via Vitest + validação manual.
- **Dívida técnica aceita:** Sempre que uma task for exportada para o kanban, copia-se `source_spec` manualmente na action de export. Isso amarra a lógica de export ao documento — se o mecanismo de export mudar, precisa manter o campo.
- **Dívida existente resolvida junto:** Nenhuma.
- **Itens registrados em `docs/TECH-DEBT.md`:** Nenhum.

## Questões em aberto

- N/A — todas as decisões foram fechadas com o usuário.

## Links

- Jira (após aprovação da spec): `docs/workflow/2026-07-24-specification-documents.jira.md`
- Feature doc (pós-implementação): `docs/features/2026-07-24-specification-documents.md`
- PR: `docs/workflow/2026-07-24-specification-documents.pr.md`
- Depende de: [`2026-07-12-planning-poker.md`](./2026-07-12-planning-poker.md), [`2026-07-12-kanban.md`](./2026-07-12-kanban.md)
- Specs relacionadas: Nenhuma
