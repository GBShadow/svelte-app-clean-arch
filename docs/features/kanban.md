# Kanban

## Resumo

Implementação de um quadro Kanban em tempo real integrado com o Planning Poker. O Kanban permite a visualização do fluxo de trabalho através de colunas ("Aguardando", "Fazendo", "Feito" e colunas personalizadas), drag and drop reativo de cards e colunas (com suporte a acessibilidade e teclado), edição rica com editor Tiptap, associação de múltiplos responsáveis, comentários e um log de histórico imutável para auditoria.

## App(s) afetado(s)

runes

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Banco de Dados (PocketBase) | `pocketbase/pb_migrations/0015_create_kanban_collections.js` |
| Domínio | `apps/runes/src/lib/domain/kanbanAccess.ts` <br> `apps/runes/src/lib/domain/KanbanBoard.svelte.ts` |
| Server | `apps/runes/src/lib/server/kanbanRecord.ts` <br> `apps/runes/src/lib/server/kanbanHistory.ts` |
| Validação | `apps/runes/src/lib/validation/kanbanSchemas.ts` |
| API (Server Actions) | `apps/runes/src/routes/kanban/+page.server.ts` |
| UI | `apps/runes/src/routes/kanban/+page.svelte` <br> `apps/runes/src/lib/components/kanban/RichTextEditor.svelte` <br> `apps/runes/src/lib/appRegistry.ts` |
| E2E Tests | `apps/runes/e2e/kanban.spec.ts` <br> `apps/runes/e2e/cleanup.ts` |

## Fluxo (Ports & Adapters)

O fluxo de dados da funcionalidade é:
1. **Renderização Inicial**: Rota `/kanban` (`+page.server.ts` -> load) busca colunas, cards, usuários, comentários e histórico usando o PocketBase Admin Client para expandir as relações com segurança, e retorna os dados com o token de realtime.
2. **Tempo Real**: A UI (`+page.svelte`) instancia a classe `KanbanBoard` e abre conexões via SSE utilizando o SDK do PocketBase. Qualquer alteração externa atualiza instantaneamente a UI reativa.
3. **Mutações (Form Actions)**: Operações de escrita e arraste chamam as Form Actions correspondentes (como `?/moveCard` ou `?/createCard`) no servidor, aplicando regras de segurança puras de domínio (`kanbanAccess.ts`), validando schemas via Zod, e persistindo os dados de forma auditável, gerando registros de histórico imutáveis via `kanbanHistory.ts`.

## API (Form Actions)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/kanban` (`createColumn`) | Cria nova coluna customizada (apenas Admin) |
| POST | `/kanban` (`renameColumn`) | Renomeia coluna customizada (apenas Admin) |
| POST | `/kanban` (`moveColumn`) | Move coluna customizada (apenas Admin) |
| POST | `/kanban` (`deleteColumn`) | Exclui coluna customizada e move cards órfãos para "Aguardando" |
| POST | `/kanban` (`createCard`) | Cria um novo cartão (qualquer usuário logado) |
| POST | `/kanban` (`updateCard`) | Atualiza dados de um cartão |
| POST | `/kanban` (`moveCard`) | Move um cartão de posição/coluna via drag and drop |
| POST | `/kanban` (`deleteCard`) | Exclui um cartão (restrito ao criador) |
| POST | `/kanban` (`addComment`) | Adiciona comentário de texto simples (até 2000 caracteres) |
| POST | `/kanban` (`deleteComment`) | Remove um comentário (restrito ao autor) |

## Como testar

### Testes Automatizados
```bash
# Executa todos os testes unitários do workspace runes (inclusive kanbanAccess e KanbanBoard)
pnpm --filter=runes test

# Executa todos os testes E2E com Playwright
pnpm test:e2e
```

### Testes Manuais
1. Faça login na aplicação e acesse `/kanban` a partir do App Hub.
2. Tente criar novos cards na coluna "Aguardando" clicando no ícone `+`. Preencha dados, atribua responsáveis e insira tags.
3. Arraste cards de uma coluna a outra, e mude suas posições internas.
4. Clique em um card para abrir os detalhes, faça modificações, envie comentários e observe a listagem de histórico no rodapé.
5. Se possuir a flag `isAdmin` como verdadeira no banco de dados, clique no botão "Colunas" no topo para criar, renomear e excluir colunas customizadas.

## Decisões de design

1. **Relacionamento com a Coleção User**: Em vez de apontar relacionamentos de criador (`created_by`) e responsáveis (`assignees`) para a tabela de credenciais `auth` (o que causaria vazamento/bloqueio devido às regras de privacidade estritas da coleção auth), apontamos todos os relacionamentos de usuários para a coleção `user`. Isso permite o expand seguro e público de nomes e avatares por qualquer usuário autenticado.
2. **Segurança (API Rules do PocketBase nulas)**: As coleções de colunas, cards e histórico têm regras de escrita (`createRule`, `updateRule`, `deleteRule`) configuradas como `null` no PocketBase. Isso impede qualquer escrita direta pelo cliente, forçando todas as requisições a passarem pelo `+page.server.ts` onde a lógica de autorização e o log de auditoria imutável são aplicados pelo servidor de forma centralizada e blindada.
3. **Validação Estrita de Posições (0-based)**: Toda movimentação ou exclusão de cards/colunas recalcula e reindexa as posições como inteiros contíguos de `0` a `N-1`. Isso previne gaps e facilita o drag and drop com a biblioteca `svelte-dnd-action`.
4. **Sanitização de HTML no Servidor**: A descrição do card suporta HTML (vindo do Tiptap), mas passa obrigatoriamente por sanitização no servidor (`sanitize-html`) antes de ser salva no banco, evitando ataques de XSS armazenado. Os comentários utilizam texto puro limitado a 2000 caracteres.
