# Preservar Remetente do Chat (chat-sender-preservar)

## Contexto

Atualmente, quando um participante é removido de uma sala de chat, ele perde o acesso à sala (o que é o comportamento esperado por segurança). No entanto, o seu nome e avatar desaparecem do feed de histórico de mensagens para os demais participantes. Isso ocorre porque o componente da interface (`+page.svelte`) resolve o remetente de cada mensagem consultando `participantsById`, que por sua vez é derivado de `data.room.expand.participants` — uma lista que contém estritamente os participantes ativos da sala de chat.

## Objetivo

Garantir que as informações de remetente (nome e avatar) das mensagens enviadas por participantes que foram posteriormente removidos ou que saíram da sala permaneçam visíveis e estáticas no feed de histórico de mensagens, sem comprometer a restrição de acesso desses usuários às salas de chat.

## Escopo

**Incluído:**
- Alteração no `load` de `apps/runes/src/routes/chat/[roomId]/+page.server.ts` para, após buscar as mensagens normalmente via `locals.pb` (cliente do usuário, já restrito pela `viewRule` de `chat_messages`), identificar os `sender` ids que não estão entre os participantes ativos da sala e resolver seus dados de perfil reaproveitando o helper já existente `fetchAuthParticipants` (`$lib/server/authExpand.ts`), que já busca `auth` via cliente administrativo projetando apenas `id`, `name`, `avatar`.
- Ajuste no componente de UI `apps/runes/src/routes/chat/[roomId]/+page.svelte` para que `participantsById` inclua também os remetentes removidos resolvidos no `load` (mapa combinado: participantes ativos + remetentes órfãos), mantendo `participantsById.get(message.sender)` como única fonte de resolução — sem necessidade de um campo `expand.sender` por mensagem.

**Fora do escopo:**
- Flexibilização das regras de API (`viewRule` / `listRule`) da coleção `auth` do PocketBase para o cliente regular, mantendo a proteção estrita de dados sensíveis de usuários.
- Armazenamento redundante ou desnormalizado de nome/avatar nas mensagens.

## Requisitos funcionais

- RF1: O feed de mensagens de uma sala de chat deve continuar exibindo o nome e o avatar correto do autor de cada mensagem histórica, mesmo após o autor ter sido removido ou ter saído da sala.
- RF2: Usuários removidos da sala de chat devem ter seu acesso revogado imediatamente à sala e a quaisquer requisições de leitura/escrita de mensagens nela.
- RF3: O feed de mensagens deve integrar de forma transparente as mensagens antigas carregadas do servidor e as novas mensagens recebidas em tempo real via PocketBase subscription.

## Requisitos não funcionais

- **Segurança**:
  - **IDOR / Escalação de Privilégios**: A regra de acesso das mensagens (`chat_messages`) continua exigindo participação na sala (`room.participants.id ?= @request.auth.id`), e a busca das mensagens continua no cliente do usuário (`locals.pb`) — nenhuma alteração amplia o raio de ação do cliente administrativo além do que já existe hoje para participantes.
  - **Prevenção de Vazamento de Dados**: Como a coleção `auth` do PocketBase é protegida e a regra `viewRule` restringe o acesso direto apenas ao próprio usuário ou a administradores, reaproveitamos o helper já existente `fetchAuthParticipants` (usado hoje para os participantes ativos da sala), que já projeta apenas `id`, `name`, `avatar` via `fields: 'id,name,avatar'` no cliente admin — garantindo que dados sensíveis de conta (ex.: `email`, hashes de senha) nunca cheguem ao cliente de frontend.
- **Performance**: A resolução de remetentes órfãos é feita apenas para os ids de `sender` que não estão entre os participantes ativos (tipicamente 0 ou poucos por página de mensagens), evitando uma nova consulta a `auth` por mensagem.
- **Resiliência a conta excluída**: `fetchAuthParticipants` usa `Promise.all`, que rejeita por completo se **qualquer** id não resolver (ex.: `getOne` retorna 404). Diferente dos participantes ativos (que normalmente ainda existem como contas válidas), um remetente histórico pode ter tido sua conta de usuário excluída permanentemente (via `/users/[id]/edit`) muito depois de enviar a mensagem. Para a resolução de remetentes órfãos especificamente, o `load` deve tolerar essa falha por item (ex.: `Promise.allSettled` ou `try/catch` por id) e usar um placeholder (`{ id, name: 'Usuário removido', avatar: '' }`) para os que não resolverem, em vez de deixar a página inteira falhar com 500 para todos os participantes da sala.

## Critérios de aceite

- [ ] AC1: Dado uma sala de chat com mensagens de múltiplos participantes, quando um participante for removido da sala, então as mensagens que ele enviou antes de ser removido devem continuar exibindo o nome e o avatar do usuário.
- [ ] AC2: Dado um participante removido de uma sala, quando ele tentar acessar a URL da sala, então o servidor deve retornar status `403 Forbidden` e impedir a visualização das mensagens.
- [ ] AC3: Dado uma mensagem nova recebida via PocketBase realtime subscription (`*` action `create`), quando o remetente for um participante ativo da sala, então o nome e o avatar devem ser exibidos imediatamente no feed com base no mapa local de participantes da sala.

## Design (Ports & Adapters)

| Camada | Mudança prevista |
|--------|-------------------|
| PocketBase | Nenhuma alteração nas coleções ou API Rules. A coleção `chat_messages` já possui o relacionamento `sender` para a coleção `auth`, e `created`/`updated` com autodate. |
| Domínio (função pura) | Nenhuma alteração necessária (regras de permissão em `chatRoomAccess.ts` permanecem inalteradas). |
| Server (types) | `apps/runes/src/lib/server/chatRecord.ts` — Sem alteração de tipos; `ChatMessageRecord` continua sem `expand`, pois a resolução de remetente passa a ser feita via `participantsById` combinado (participantes ativos + órfãos), não por mensagem. |
| API | `apps/runes/src/routes/chat/[roomId]/+page.server.ts` — Após buscar `messages` normalmente via `locals.pb`, calcular `orphanSenderIds = [...new Set(messages.map(m => m.sender))].filter(id => !room.expand.participants.some(p => p.id === id))` e, se não vazio, resolver cada id individualmente (não com `fetchAuthParticipants` direto, que usa `Promise.all` e rejeitaria tudo se um id não existir mais) usando `Promise.allSettled` ou `try/catch` por id, caindo para `{ id, name: 'Usuário removido', avatar: '' }` quando o registro `auth` não existir mais. Retornar o resultado num campo **novo e separado**, `orphanSenders: AuthParticipant[]`, sem tocar em `room.expand.participants` — esse array precisa continuar contendo *apenas* participantes ativos, pois também alimenta a lista de gerenciamento de participantes (`otherParticipants`, botão "remover") da UI. |
| UI | `apps/runes/src/routes/chat/[roomId]/+page.svelte` — Atualizar apenas o `$derived` de `participantsById` para mesclar as duas fontes: `new Map([...(data.room.expand?.participants ?? []), ...(data.orphanSenders ?? [])].map((p) => [p.id, p]))`. `otherParticipants` (lista de gerenciamento) continua lendo só `data.room.expand?.participants`, sem incluir remetentes órfãos. |

## Contrato de API

Não há novos endpoints ou ações de formulário criados. O contrato de retorno da página (`PageServerLoad`) ganha um único campo novo, `orphanSenders`, com os dados (não sensíveis) dos remetentes que enviaram mensagens na sala mas não estão mais entre os participantes ativos:

### PageServerLoad (`apps/runes/src/routes/chat/[roomId]/+page.server.ts`)

- **Retorno:**
  ```ts
  {
      room: ChatRoomRecord; // expand.participants continua só com participantes ativos
      messages: ChatMessageRecord[]; // sem alteração de tipo
      orphanSenders: AuthParticipant[]; // novo — remetentes de mensagens que não são mais participantes
      userId: string;
      pbToken: string;
      pbRecord: AuthRecord;
  }
  ```

## Alternativas consideradas

- **Alternativa 1: Abrir a regra de view da coleção `auth` para todos os autenticados (`@request.auth.id != ''`)**: 
  - *Desvantagem*: Isso permitiria a qualquer usuário autenticado listar ou visualizar detalhes de outros usuários de forma direta no PocketBase (abrindo margem para raspagem de dados e potencial vazamento de informações privadas se novos campos forem adicionados). Rejeitado em favor do uso controlado de cliente admin no backend.
- **Alternativa 2 (rejeitada): trocar a consulta de `chat_messages` no `load` para o cliente admin com `expand: 'sender'` e uma projeção `fields` aninhada (`items.expand.sender.id,...`)**:
  - *Desvantagem*: amplia desnecessariamente o uso do cliente admin (que hoje é usado pontualmente, ex. `fetchAuthParticipants`) para toda a consulta principal de mensagens, que já é servida com segurança pelo cliente do usuário via `viewRule` de `chat_messages`. Também introduz uma sintaxe de `fields` combinando projeção de lista (`items.*`) com projeção de relação expandida que é fácil de errar e não tem precedente no código. Rejeitada em favor de reaproveitar `fetchAuthParticipants` (já usado para os participantes ativos) apenas para os `sender` ids órfãos, o que é mais simples, evita duplicar o mecanismo de resolução de perfil e mantém o raio de ação do cliente admin igual ao que já existe hoje.

## Questões em aberto

- Nenhuma.

## Links

- Specs relacionadas: [chat-realtime.md](./chat-realtime.md)
