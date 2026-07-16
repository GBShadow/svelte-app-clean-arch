# Planning Poker — Documentação da Feature

Created: 2026-07-12


O módulo de **Planning Poker** é uma ferramenta colaborativa em tempo real integrada ao Kanban, projetada para permitir que equipes de desenvolvimento estimem o esforço de suas tarefas (usando a sequência de Fibonacci) de forma segura e síncrona.

---

## 1. Arquitetura de Banco de Dados (PocketBase)

A feature é composta por quatro coleções no PocketBase, projetadas com integridade referencial e regras de API rígidas:

### 1.1. `poker_rooms`
Armazena a sala de votação ativa.
- `name` (text, required): Nome descritivo da sala.
- `created_by` (relation → `user`, required): Administrador/Criador da sala.
- `current_task` (text, nullable): ID da tarefa ativa em votação.
- `revealed` (bool): Estado de revelação dos votos da rodada.

### 1.2. `poker_tasks`
Armazena as tarefas cadastradas no backlog da sala.
- `room` (relation → `poker_rooms`, required, cascade delete): Sala à qual a tarefa pertence.
- `title` (text, required): Título da tarefa.
- `description` (text, HTML sanitizado): Descrição detalhada (Editor Tiptap).
- `final_points` (number, nullable): Pontuação final acordada (Story Points).
- `status` (select: `backlog`, `voting`, `estimated`, `exported`): Status da tarefa.
- `exported_card` (relation → `kanban_cards`, nullable): Card correspondente criado no Kanban.

### 1.3. `poker_participants`
Representa a participação e a presença online de um usuário na sala.
- `room` (relation → `poker_rooms`, required, cascade delete): A sala.
- `user` (relation → `user`, required): Usuário do sistema.
- `role` (select: `admin`, `voter`, `spectator`): Papel na sala.
- `is_online` (bool): Presença realtime controlada pelo browser client.
- `has_voted` (bool): Sinalizador de voto submetido na rodada atual.
- `has_left` (bool): Indica se o participante abandonou a sala.

### 1.4. `poker_votes`
Armazena de forma isolada e segura os votos dos participantes.
- `room` (relation → `poker_rooms`, required, cascade delete)
- `task` (relation → `poker_tasks`, required, cascade delete)
- `user` (relation → `user`, required)
- `value` (text, required): Valor votado (Fibonacci, `?` ou `☕`).

---

## 2. Segurança e Sigilo dos Votos

Para evitar o vazamento de votos em tempo real (votos ocultos vazando pelo SSE ou aba Network), foram implementadas as seguintes regras de API (`listRule`/`viewRule`) na coleção `poker_votes`:

```go
@request.auth.id != '' && 
room.poker_participants_via_room.user.email = @request.auth.email && 
room.poker_participants_via_room.has_left = false && 
(user.email = @request.auth.email || room.revealed = true)
```

### Como funciona:
1. Enquanto `room.revealed` for `false` (votação em andamento), o participante logado consegue listar/visualizar **apenas o seu próprio voto**. Os demais votos retornam vazios ou são ignorados pelas APIs do PocketBase.
2. Assim que o administrador muda o status da sala para `revealed = true`, a regra de API libera a leitura de todos os votos associados à rodada, e o cliente realiza um refetch automático para atualizar o gráfico e a lista na UI.

---

## 3. Estado Reativo Client-Side (`PlanningPokerRoom.svelte.ts`)

A classe de estado reativo encapsula toda a lógica e gerencia a sincronização em tempo real das coleções por meio de Server-Sent Events (SSE).

### Responsabilidades:
- Consolidar participantes ativos e filtrar espectadores.
- Computar médias numéricas de forma pura (desconsiderando `?` e `☕` nas médias matemáticas).
- Mapear a distribuição de frequência de votos para renderização do gráfico de barras.
- Gerenciar as assinaturas realtime no PocketBase e fazer o cleanup correto de listeners no `onDestroy`.

---

## 4. Fluxo Colaborativo de Trabalho

1. **Criação da Sala & Auto-join**: Qualquer usuário autenticado cria uma sala. Ao acessar `/poker/[roomId]`, se o usuário não for participante ativo, a action do servidor adiciona-o automaticamente como `voter` (votante).
2. **Presença Online**: Quando o browser monta a sala, marca `is_online = true`. Ao sair ou fechar a aba do navegador (`beforeunload`), marca `is_online = false` instantaneamente.
3. **Gerenciamento do Backlog**: Participantes adicionam tarefas usando o editor rico (HTML sanitizado). O administrador seleciona uma tarefa para votação.
4. **Votação**: Os participantes votantes escolhem uma carta do baralho Fibonacci. A UI indica quem já votou por meio de badges discretos de status.
5. **Revelação & Consensual**: Após todos votarem (ou quando o admin decidir), os votos são revelados, exibindo médias e o gráfico de distribuição de opiniões. O administrador pode reiniciar a rodada se não houver consenso.
6. **Pontuação e Exportação**: Definido o consenso, o admin atribui a pontuação final na tarefa e clica em **Exportar para o Kanban**. Isso cria automaticamente os cards correspondentes na coluna "Aguardando" (Backlog) do Kanban com o valor de Story Points preenchido.
