# Rotas — svelte-app-clean-arch

> **Propósito:** Mapa completo de todas as rotas do app `apps/runes/`.
> **Regra:** Este arquivo deve ser **sempre atualizado** ao adicionar, remover ou alterar qualquer rota.

---

## Convenções

- **Autenticação global:** `hooks.server.ts` — redireciona para `/login` se não autenticado (exceto `/login`).
- **Gate de senha expirada:** `hooks.server.ts` — redireciona para `/change-password` se a senha estiver vencida (exceto `/change-password` e `/logout`).
- **Admin-only:** guard explícito via `locals.user?.isAdmin` no `load` ou action.
- **API routes (`/api/*`):** retornam JSON; autenticação via `locals.pb`, sem redirect (erro 401).
- **Data routes:** páginas SSR com `load` + form actions (`use:enhance`).
- **Realtime:** algumas páginas expõem `pbToken`/`pbRecord` no load para subscriptions client-side (`pocketbaseClient.ts`).

---

## Árvore de Rotas

### Home

| Rota | Arquivos | Funções | Proteção |
|------|----------|---------|----------|
| `/` | `+layout.server.ts` | `load` — expõe `user`, `pbToken`, `pbRecord` | hooks global |
| | `+layout.svelte` | Navbar, `NotificationBell`, logout, alerta change-password | — |
| | `+page.server.ts` | `load` — `{ pendingCount }` | hooks global |
| | `+page.svelte` | App Grid (`appRegistry`), filtra apps admin-only | — |

### Autenticação

| Rota | Arquivos | Funções | Proteção |
|------|----------|---------|----------|
| `/login` | `+page.server.ts` | `load` — redireciona para `/` se já autenticado | Público |
| | | `actions.default` — login via `authWithPassword` | |
| | `+page.svelte` | Formulário de login | |
| `/logout` | `+server.ts` | `POST` — limpa sessão, redireciona para `/login` | hooks (exceto senha) |
| `/change-password` | `+page.server.ts` | `load` — `{ user }` | hooks (exceto senha) |
| | | `actions.default` — valida senha atual + atualiza | |
| | `+page.svelte` | Formulário de troca de senha | |

### Perfil

| Rota | Arquivos | Funções | Proteção |
|------|----------|---------|----------|
| `/profile` | `+page.server.ts` | `load` — `{ user, authId }` | hooks global |
| | | `actions.uploadAvatar` — atualiza avatar (jpg/png/webp, ≤2MB) | |
| | `+page.svelte` | Avatar atual + upload + botão notificações push | |

### Usuários (admin)

| Rota | Arquivos | Funções | Proteção |
|------|----------|---------|----------|
| `/users` | `+page.server.ts` | `load` — lista de usuários | Admin-only |
| | `+page.svelte` | Tabela de usuários | |
| `/users/new` | `+page.server.ts` | `actions.default` — cria auth + user (com rollback) | Admin-only |
| | `+page.svelte` | Formulário de criação | |
| `/users/[id]/edit` | `+page.server.ts` | `load` — `{ targetUser, canEditEmail }` | Admin ou self |
| | | `actions.update` — atualiza dados | Admin ou self |
| | | `actions.resetPassword` — reseta senha + `mustChangePassword` | Admin-only |
| | | `actions.delete` — deleta user + auth | Admin-only |
| | `+page.svelte` | Formulário de edição | |

### Todo Lists

| Rota | Arquivos | Funções | Proteção |
|------|----------|---------|----------|
| `/todos` | `+page.server.ts` | `load` — listas do usuário (`owner`) | hooks global |
| | `+page.svelte` | Listagem de listas | |
| `/todos/new` | `+page.server.ts` | `actions.default` — cria lista | hooks global |
| | `+page.svelte` | Formulário de criação | |
| `/todos/[id]` | `+page.server.ts` | `load` — lista + itens (acesso via `canView`) | Dono ou público |
| | | `actions.updateTitle` — renomear | Owner-only |
| | | `actions.togglePublic` — alternar visibilidade | Owner-only |
| | | `actions.delete` — excluir lista | Owner-only |
| | | `actions.addItem` — adicionar item | Owner-only |
| | | `actions.toggleItem` — alternar done | Owner-only |
| | | `actions.removeItem` — remover item | Owner-only |
| | `+page.svelte` | Detalhe da lista com itens | |

### Chat

| Rota | Arquivos | Funções | Proteção |
|------|----------|---------|----------|
| `/chat` | `+page.server.ts` | `load` — salas do usuário (com preview última msg) | hooks global |
| | `+page.svelte` | Listagem de salas | |
| `/chat/new` | `+page.server.ts` | `load` — usuários disponíveis | hooks global |
| | | `actions.default` — criar sala com participantes | |
| | `+page.svelte` | Formulário de criação | |
| `/chat/[roomId]` | `+page.server.ts` | `load` — sala + mensagens + token impersonate (10min) | Participante |
| | | `actions.sendMessage` — enviar mensagem + push/notify | Participante |
| | | `actions.leaveRoom` — sair (transfere criador se necessário) | Participante |
| | | `actions.addParticipant` — adicionar por email | Creator-only |
| | | `actions.removeParticipant` — remover (exceto self) | Creator-only |
| | `+page.svelte` | Mensagens realtime + participantes | |

### Kanban

| Rota | Arquivos | Funções | Proteção |
|------|----------|---------|----------|
| `/kanban` | `+page.server.ts` | `load` — se `?project=` setado: colunas, cards, etc. Salva cookie `lastKanbanProject`. Se sem `?project=` e sem cookie: retorna `project: null` + projetos acessíveis. Se sem `?project=` com cookie: redireciona para `/kanban?project=<last>`. | hooks global |
| | | `actions.createColumn` — criar coluna personalizada | `canManageColumns` |
| | | `actions.renameColumn` — renomear (só colunas custom) | `canManageColumns` |
| | | `actions.moveColumn` — reordenar colunas | `canManageColumns` |
| | | `actions.deleteColumn` — deletar + órfãos para backlog | `canDeleteColumn` |
| | | `actions.createCard` — criar card (HTML sanitizado) + notify | `canCreateCard` |
| | | `actions.updateCard` — atualizar card + notify assignees | `canUpdateCard` |
| | | `actions.moveCard` — mover/reordenar + notify | `canUpdateCard` |
| | | `actions.deleteCard` — deletar + notify | `canDeleteCard` |
| | | `actions.addComment` — comentar + notify assignees | Qualquer autenticado |
| | | `actions.deleteComment` — deletar comentário | Dono do comentário |
| | `+page.svelte` | Quadro Kanban (drag and drop) com seletor de projeto no topo. Quando `project` é null (primeiro acesso sem cookie), mostra empty state com mensagem para selecionar um projeto. | |

### Planning Poker

| Rota | Arquivos | Funções | Proteção |
|------|----------|---------|----------|
| `/poker` | `+page.server.ts` | `load` — salas ativas + tasks globais desvinculadas | hooks global |
| | | `actions.createRoom` — criar sala | hooks global |
| | `+page.svelte` | Listagem de salas | |
| `/poker/[roomId]` | `+page.server.ts` | `load` — sala, participantes (auto-join), tarefas, votos | hooks global |
| | | `actions.vote` — votar (Fibonacci) | `canVote` |
| | | `actions.reveal` — revelar votos | `canReveal` |
| | | `actions.resetVotes` — resetar rodada | Admin |
| | | `actions.setTask` — definir tarefa atual | `canSetTask` |
| | | `actions.createTask` — criar tarefa na sala | `canCreateTaskInRoom` |
| | | `actions.setFinalPoints` — definir pontos finais | Admin |
| | | `actions.changeRole` — alterar papel | Admin |
| | | `actions.removeParticipant` — remover participante | Admin |
| | | `actions.leaveRoom` — sair da sala | Participante |
| | | `actions.exportToKanban` — exportar tasks estimadas | `canExportFromRoom` |
| | | `actions.linkGlobalTasks` — vincular tasks globais | `canLinkGlobalTasks` |
| | | `actions.editTask` — editar descrição | `canEditTaskInRoom` |
| | | `actions.removeTaskFromVoting` — remover da votação | `canRemoveFromVoting` |
| | | `actions.finalize` — finalizar sala | `canFinalizeRoom` |
| | `+page.svelte` | Sala de poker (baralho, votos, participantes) | |
| `/poker/backlog` | `+page.server.ts` | `load` — tasks globais (`is_global_backlog`) | hooks global |
| | | `actions.createGlobalTask` — criar task global | Admin |
| | | `actions.editGlobalTask` — editar task global | Admin |
| | | `actions.deleteGlobalTask` — deletar task global | Admin |
| | `+page.svelte` | Backlog global de tarefas | |

### Notificações

| Rota | Arquivos | Funções | Proteção |
|------|----------|---------|----------|
| `/notifications` | `+page.server.ts` | `load` — notificações paginadas + `unreadCount` | hooks global (401 se sem user) |
| | `+page.svelte` | Central de notificações | |

### API — Notificações

| Rota | Arquivos | Funções | Proteção |
|------|----------|---------|----------|
| `/api/notifications` | `+server.ts` | `GET` — lista paginada (JSON) | 401 se sem user |
| `/api/notifications/[id]` | `+server.ts` | `DELETE` — deletar notificação | 401 se sem user |
| `/api/notifications/read` | `+server.ts` | `POST` — marcar IDs específicos como lidas | 401 se sem user |
| `/api/notifications/read-all` | `+server.ts` | `POST` — marcar todas como lidas | 401 se sem user |
| `/api/notifications/unread-count` | `+server.ts` | `GET` — `{ count }` de não lidas | 401 se sem user |

### API — Push

| Rota | Arquivos | Funções | Proteção |
|------|----------|---------|----------|
| `/api/push/subscribe` | `+server.ts` | `POST` — cadastrar/renovar PushSubscription (idempotente) | 401 se sem user |
| `/api/push/unsubscribe` | `+server.ts` | `POST` — remover PushSubscription | 401 se sem user |

---

## Matriz de Proteção

| Padrão | Onde |
|--------|------|
| **hooks global** (redirect `/login`) | Todas as rotas exceto `/login` |
| **Gate de senha expirada** (redirect `/change-password`) | Todas exceto `/change-password` e `/logout` |
| **Redirect se já autenticado** | `/login` |
| **Admin-only** (`isAdmin`) | `/users`, `/users/new`, `/users/[id]/edit` (resetPassword/delete), `/poker/backlog` (escrita) |
| **Self ou admin** (`canAccess`) | `/users/[id]/edit` (load + update) |
| **Owner-only** (`canWrite`) | `/todos/[id]` (escrita) |
| **View permission** (`canView`) | `/todos/[id]` (load) |
| **Participante** (`isParticipant`) | `/chat/[roomId]` (load, sendMessage, leaveRoom) |
| **Creator-only** (`isCreator`) | `/chat/[roomId]` (addParticipant, removeParticipant) |
| **Domínio Kanban** (`canManageColumns`, `canCreateCard`, etc.) | `/kanban` (ações específicas) |
| **Domínio Poker** (`canVote`, `canReveal`, `canManageRoom`, etc.) | `/poker/[roomId]` (ações específicas) |
| **Auto-join** (cria participante se ausente) | `/poker/[roomId]` (load) |
| **401 explícito** (sem redirect) | `/notifications`, `/api/*` |

---

## Manutenção

Ao adicionar uma nova rota:

1. Adicione a entrada nesta tabela com a rota, arquivos, funções e proteção
2. Mantenha a árvore organizada por domínio (autenticação, admin, chat, kanban, poker, etc.)
3. Atualize `docs/CODE-STRUCTURE.md` seção 2.1 se a estrutura de pastas mudar
4. Atualize `docs/CHANGELOG.md` se for uma nova funcionalidade
