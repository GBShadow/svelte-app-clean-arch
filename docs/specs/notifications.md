# Notificações Push (Self-Hosted)

## Contexto

Atualmente, o monorepo suporta comunicação em tempo real no chat via PocketBase SSE/WebSockets, mas os usuários só percebem novas mensagens se estiverem com a sala ativa e em foco. Usuários offline, navegando em outras abas, ou com o navegador minimizado não recebem alertas.

Além disso, outras funcionalidades (como Kanban ou futuras iterações do app) necessitam de um canal de comunicação assíncrona para alertar os usuários sobre eventos importantes do sistema (ex.: cartões atribuídos, prazos expirando).

Para solucionar isso de forma privada e robusta, é necessária uma infraestrutura de push notifications de navegador nativa (Notification API + Push API + Service Worker) e totalmente self-hosted no backend SvelteKit (usando a biblioteca `web-push` e chaves VAPID), evitando a dependência de serviços proprietários de terceiros (como Firebase Cloud Messaging ou OneSignal).

## Objetivo

Implementar uma infraestrutura genérica de Web Push self-hosted capaz de:
1. Enviar notificações em tempo real de novas mensagens de chat para os participantes elegíveis (com lógica de supressão se o receptor já estiver lendo a sala).
2. Fornecer uma interface reutilizável para que outros fluxos do sistema disparem notificações push genéricas (título, descrição, rota de redirecionamento) para usuários específicos.

## Escopo

**Incluído:**
- Configuração e armazenamento seguro de um par de chaves VAPID (env vars `PUBLIC_VAPID_PUBLIC_KEY` — pública, exposta ao client; `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` — privadas, só no servidor).
- Coleção PocketBase `push_subscriptions` para armazenar as assinaturas dos navegadores atreladas aos usuários.
- Endpoints SvelteKit de API para cadastro (`/api/push/subscribe`) e remoção (`/api/push/unsubscribe`) de assinaturas.
- Botão/Controle explícito de permissão de notificação exposto na tela de Perfil (`/profile`) e um banner contextual de ativação no Chat.
- Service Worker configurado para escutar o evento `push` e tratar de forma distinta notificações do tipo `chat` (com supressão inteligente de aba focada) e do tipo `system` (notificação de sistema/outros serviços).
- Lógica de redirecionamento ao clicar no push, focando na aba existente ou abrindo uma nova aba.
- Tratamento automático de erro no backend para excluir assinaturas expiradas/inválidas (erros HTTP 404/410 vindos da Push API) via cliente superusuário (`getAdminClient()`).
- Suporte a múltiplos dispositivos/assinaturas por usuário.

**Fora do escopo:**
- Configuração de silenciar/mutar notificações para salas de chat específicas nesta rodada.
- Controle fino de categorias de notificações nas configurações do usuário (ex.: "receber apenas chat").
- Badge persistente de contador de mensagens não lidas no ícone do app.
- Garantia de entrega e suporte em navegadores sem suporte completo a Service Workers/Push API (ex.: iOS Safari antigo ou restrito) — melhor esforço.

## Requisitos funcionais

- **RF1 (Consentimento e Cadastro)**: O usuário autenticado pode habilitar notificações. O navegador solicita permissão nativa; se aceita, o Service Worker gera uma `PushSubscription` (usando a `PUBLIC_VAPID_PUBLIC_KEY` como `applicationServerKey`) e a envia ao endpoint `/api/push/subscribe` para ser vinculada ao usuário.
- **RF1.1 (Idempotência de re-cadastro)**: O endpoint `/api/push/subscribe` deve ser idempotente por `endpoint`. Como a coleção tem `endpoint` único e `updateRule = false`, uma reassinatura do mesmo dispositivo (rotação das chaves `p256dh`/`auth` ou permissão reconcedida) faz o endpoint **remover a linha existente e recriar** (delete-then-create) em vez de falhar por conflito de unicidade. A resposta é `201` em ambos os casos.
- **RF1.2 (Permissão negada/bloqueada)**: Quando `Notification.permission === 'denied'`, a UI de Perfil não tenta re-solicitar (o navegador bloqueia o prompt programático) e exibe um estado "bloqueado" com instrução de como reabilitar manualmente nas configurações do navegador.
- **RF2 (Múltiplas Assinaturas)**: O sistema deve suportar que o mesmo usuário possua várias assinaturas registradas (ex.: celular, notebook pessoal, notebook de trabalho). Todas devem receber o disparo do push.
- **RF3 (Notificação de Chat - Regra de Envio)**: Ao enviar uma mensagem de chat, o servidor identifica todos os participantes da sala (exceto o próprio remetente) e dispara um push para todas as suas assinaturas ativas com o payload JSON da notificação de chat (ver seção Payload de Push abaixo).
- **RF4 (Notificação de Chat - Regra de Supressão)**: O Service Worker do receptor intercepta o push de chat. Ele verifica, via `clients.matchAll({ type: 'window', includeUncontrolled: true })`, se o usuário possui alguma aba na URL da sala (`/chat/[roomId]`) que esteja **focada** (`client.focused === true`). Se houver, a notificação do sistema é suprimida; caso contrário (inclusive se a aba existir mas estiver sem foco), ela é exibida mostrando o nome do remetente e o preview da mensagem. A decisão de supressão fica isolada em uma **função pura** (`shouldSuppressChatPush`) para ser testável fora do contexto do Service Worker (ver Design).
- **RF5 (Notificação de Sistema - Regra de Envio)**: Qualquer serviço do sistema pode requisitar o disparo de uma notificação push chamando a função server-side exportada `sendSystemPush(userIds, payload)` de `webPush.ts`, informando os IDs dos usuários destinatários, título, corpo da notificação e uma URL de destino para redirecionamento.
- **RF6 (Notificação de Sistema - Exibição)**: Ao contrário do chat, as notificações de sistema não são suprimidas e sempre disparam o alerta nativo do sistema operacional.
- **RF7 (Tratamento de Cliques)**: Ao clicar em uma notificação push do app, o navegador deve focar uma aba do app que já esteja aberta (ou abrir uma nova aba) redirecionando para a URL especificada no payload da notificação. A `url` só é aceita se for um path relativo same-origin (começar com `/`); valores absolutos ou esquemas como `javascript:` são rejeitados/normalizados (ver RNF de Segurança).
- **RF8 (Limpeza Automática)**: Se o disparo de push falhar com erro HTTP 404 (Not Found) ou 410 (Gone), indicando que a assinatura expirou ou foi cancelada no navegador, o backend deve imediatamente remover a respectiva linha de `push_subscriptions` no PocketBase. Como o disparo ocorre no contexto do remetente (que não é dono da subscription), a remoção usa o cliente superusuário `getAdminClient()` — seguindo o mesmo padrão de `leaveRoom` no chat.
- **RF9 (Isolamento de Participação)**: Usuário que não é participante de uma sala de chat nunca recebe notificação push de novas mensagens daquela sala, mesmo que possua assinaturas ativas.
- **RF10 (Desativação)**: Usuário autenticado pode desativar notificações push a qualquer momento pela tela de Perfil (`/profile`). A desativação remove a assinatura do dispositivo atual chamando o endpoint `/api/push/unsubscribe` e revoga o registro do `PushManager` no navegador via `subscription.unsubscribe()`.

## Requisitos não funcionais

- **Segurança (Privacidade e IDOR)**: As regras de API Rules da coleção `push_subscriptions` devem garantir que apenas o próprio dono da assinatura possa listá-la, visualizá-la ou deletá-la. A regra de criação deve exigir autenticação e forçar que o campo `user` bata com o ID do usuário logado. Nenhuma modificação (update) direta será permitida na coleção por usuários normais. **O cadastro/remoção pelo usuário (`/api/push/subscribe` e `/api/push/unsubscribe`) usa `locals.pb`** — respeitando `createRule`/`deleteRule` de posse como defesa em profundidade real (o PocketBase, não só o código do endpoint, impede IDOR). O `unsubscribe` filtra a linha a apagar por `endpoint`, mas a `deleteRule` de posse garante que ninguém apague a subscription de outro usuário mesmo conhecendo o endpoint. **Apenas** a limpeza server-side de subscriptions inválidas (RF8) usa `getAdminClient()`, porque ocorre no contexto do remetente (que não é dono da subscription) e precisa contornar a `deleteRule` de posse.
- **Segurança (Redirecionamento)**: A `url` de qualquer payload (`chat` ou `system`) usada em `notificationclick` deve ser um path relativo same-origin (validado por começar com `/` e não conter `//`/esquema). `sendSystemPush` valida esse contrato para não permitir que um serviço chamador injete `javascript:` ou origem externa em `clients.openWindow`.
- **Segurança (SSRF via `endpoint` de subscription)**: `endpoint` (RF1) é gravado pelo usuário via `/api/push/subscribe` e, mais tarde, é o destino de um `POST` feito pelo **servidor** (`webPush.ts` → `webpush.sendNotification`). Sem restrição, um usuário autenticado poderia registrar um `endpoint` apontando para um serviço interno (ex.: `127.0.0.1:8090`, metadata endpoint de nuvem) e o backend faria a requisição por ele (SSRF). `subscribeSchema` valida `endpoint` contra uma allowlist dos hosts de push conhecidos dos navegadores suportados (`fcm.googleapis.com`, `updates.push.services.mozilla.com`, `web.push.apple.com`, etc.), exigindo `https:` e comparando o hostname exato ou como subdomínio real (não por `includes`, que seria contornável com `fcm.googleapis.com.evil.com`).
- **Segurança (Chaves VAPID)**: As chaves VAPID devem ser mantidas em variáveis de ambiente: `PUBLIC_VAPID_PUBLIC_KEY` (chave pública, lida no client via `$env/static/public` — o prefixo `PUBLIC_` é o mecanismo do SvelteKit para expor um valor estático ao browser; usada só como `applicationServerKey` em `pushManager.subscribe`), `VAPID_PRIVATE_KEY` (chave privada, lida via `$env/static/private`, nunca exposta ao client) e `VAPID_SUBJECT` (e-mail ou URL de contato, exigido pela spec VAPID). Valores de exemplo devem ser adicionados ao `.env.example`, com nota de que as chaves reais são geradas por `npx web-push generate-vapid-keys`.
- **Desempenho (Assincronismo)**: O envio das notificações push é best-effort e deve rodar em background (fire-and-forget, sem `await` no caminho crítico). O envio de uma mensagem no chat ou a mutação no Kanban não podem ficar travadas aguardando a resposta das requisições HTTP de push da biblioteca `web-push`.
- **Validação de Payload**: Todas as requisições aos endpoints `/api/push/*` devem ser validadas utilizando schemas Zod no backend.
- **Limite de tamanho do push**: O payload cifrado do Web Push é limitado a ~4KB. O preview de chat é truncado em 120 caracteres (bem abaixo do limite); para `sendSystemPush`, `title`+`body`+`url` serializados em JSON devem respeitar o limite — payloads maiores são rejeitados/truncados antes do envio.
- **Testabilidade**: A formatação/validação de payloads (truncamento, checagem de URL segura, montagem do JSON) vive em um módulo puro (`$lib/domain/pushPayload.ts`), testável sem mocks. `webPush.ts`/`pushSubscriptionStore.ts` ficam finos (chamada à lib `web-push` e ao PocketBase via `getAdminClient()`), seguindo a convenção já existente no projeto de que wrappers `lib/server/*` de integração externa (ex.: `kanbanHistory.ts`, `authExpand.ts`) não têm teste unitário direto — a cobertura desses módulos é via e2e/verificação manual.

## Critérios de aceite

- [ ] AC1: Dado um usuário autenticado que clica em "Ativar notificações" e concede permissão, quando a API é chamada, então a assinatura VAPID é gerada e salva no PocketBase vinculada ao ID do usuário.
- [ ] AC2: Dado um usuário com múltiplas assinaturas (dispositivos diferentes), quando ele recebe uma notificação, então todos os seus dispositivos registrados recebem a notificação push.
- [ ] AC3: Dado um participante de chat, quando outro envia mensagem e o receptor **não está** com a aba da sala aberta/focada, então a notificação do sistema com o nome do remetente e o preview da mensagem (truncado em 120 caracteres) é exibida.
- [ ] AC4: Dado um participante de chat, quando outro envia mensagem e o receptor **está** com a aba da sala aberta e em foco, então nenhuma notificação push nativa do sistema é mostrada.
- [ ] AC5: Dado um usuário que recebe uma notificação push de sistema ou chat, quando ele clica nela, então a aba correspondente é focada/aberta na rota especificada no payload.
- [ ] AC6: Dado um usuário cuja assinatura no navegador expirou (gerando falha 404/410 no `web-push`), quando o backend tenta disparar um push, então o registro obsoleto é removido do PocketBase automaticamente via `getAdminClient()`.
- [ ] AC7: Dado um participante com a sala aberta mas **em outra aba sem foco**, quando outro participante envia uma mensagem, então a notificação push é exibida normalmente.
- [ ] AC8: Dado um usuário com notificações ativas, quando ele clica em "Desativar notificações" na tela de Perfil, então a assinatura do dispositivo atual é removida do PocketBase e o `PushManager` do navegador é revogado.
- [ ] AC10: Dado um dispositivo que já possui assinatura registrada, quando o usuário reativa/reassina (mesmo `endpoint`), então o cadastro é idempotente (delete-then-create) e não falha por conflito de unicidade.
- [ ] AC11: Dado um usuário com `Notification.permission === 'denied'`, quando ele abre a tela de Perfil, então é exibido o estado "bloqueado" com instrução de reabilitação manual, sem disparar prompt programático.
- [ ] AC12: Dado um usuário que conhece o `endpoint` da assinatura de outro usuário, quando chama `/api/push/unsubscribe` com esse endpoint, então a `deleteRule` de posse impede a remoção da assinatura alheia.
- [ ] AC9: Dado um usuário que não é participante de uma sala de chat, quando uma mensagem é enviada nessa sala, então nenhum push é disparado para ele, mesmo que possua assinaturas ativas.
- [ ] Testes automatizados cobrindo a lógica pura de supressão (`shouldSuppressChatPush`, testável sem mocks de `self`/`clients`) e a formatação/validação de payloads (`pushPayload.ts`: truncamento, url segura, montagem do JSON).

## Design (Ports & Adapters — padrão runes)

> **Nota:** o app `runes` **não** usa a abstração `Gateway`/`HttpGateway`/`MemoryGateway` de `packages/todo-domain` para features PocketBase — isso é resquício de uma versão anterior do projeto. O padrão real (como em `chat-realtime`) faz as mutações via _form actions_ (`+page.server.ts` chamando `locals.pb`), com a lógica de autorização isolada em funções puras (`$lib/domain/...`) e estado reativo consumindo subscriptions (`.svelte.ts`).

| Camada | Mudança prevista |
|--------|-------------------|
| PocketBase | Migration cria `push_subscriptions` (`user` relation → `auth` required cascadeDelete, `endpoint` text required único, `p256dh` text required, `auth_key` text required, `created`/`updated` autodate) |
| PocketBase | API Rules `push_subscriptions`: `listRule` = `user = @request.auth.id`; `viewRule` = `user = @request.auth.id`; `createRule` = `@request.auth.id != '' && user = @request.auth.id`; `deleteRule` = `user = @request.auth.id`; `updateRule` = `false` |
| Domínio (função pura) | `apps/runes/src/lib/domain/pushPayload.ts` — `truncateMessage`, `isSafeRedirectUrl`, `buildChatPushPayload`, `buildSystemPushPayload` (formatação/validação, testável) |
| Server (types) | `apps/runes/src/lib/server/pushRecord.ts` — `PushSubscriptionRecord` correspondente à coleção do PocketBase |
| Server (VAPID) | `apps/runes/src/lib/server/vapidKeys.ts` — lê/valida `PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (`$env/static/private`) e `VAPID_SUBJECT` |
| Server (web-push) | `apps/runes/src/lib/server/webPush.ts` — wrapper fino sobre a lib `web-push`: configura VAPID details, trunca o preview de chat em 120 chars, valida a `url` como path same-origin, expõe `sendChatPush(roomId, roomName, senderName, text, recipientUserIds)` e `sendSystemPush(userIds, payload)`, trata erros 404/410 delegando remoção a `pushSubscriptionStore` |
| Server (store) | `apps/runes/src/lib/server/pushSubscriptionStore.ts` — leitura por userId e remoção de subscriptions inválidas via `getAdminClient()` (contexto do remetente, RF8). O cadastro/remoção **pelo próprio usuário** ocorre nos endpoints via `locals.pb` (respeitando as API Rules de posse), não aqui |
| Server (integração) | `apps/runes/src/routes/chat/[roomId]/+page.server.ts` — no action `sendMessage`, após criar a mensagem, chama `sendChatPush()` de forma fire-and-forget (sem `await` no caminho crítico) |
| Validação | `apps/runes/src/lib/validation/pushSchemas.ts` — schemas Zod: `subscribeSchema` (`endpoint`, `keys.p256dh`, `keys.auth`) e `unsubscribeSchema` (`endpoint`) |
| API | `apps/runes/src/routes/api/push/subscribe/+server.ts` — POST: valida com `subscribeSchema`, faz upsert idempotente por `endpoint` (delete-then-create) via `locals.pb`, forçando `user = authUserId`; `201` |
| API | `apps/runes/src/routes/api/push/unsubscribe/+server.ts` — POST: valida com `unsubscribeSchema`, remove a subscription do `endpoint` via `locals.pb` (a `deleteRule` de posse garante escopo ao próprio usuário); `204` |
| Client (pura) | `apps/runes/src/lib/client/pushDecision.ts` — `shouldSuppressChatPush(clients, roomUrl)`: função pura testável no Vitest com fakes (sem depender de `self`/`clients` global) |
| Client (SW) | `apps/runes/src/service-worker.ts` — Service Worker do SvelteKit: evento `push` (parse payload JSON, delega decisão de supressão de `chat` a `shouldSuppressChatPush`, exibição incondicional para `system`); evento `notificationclick` (valida `url` same-origin e foca/abre aba) |
| Client (helper) | `apps/runes/src/lib/client/pushSubscription.ts` — registra Service Worker, solicita permissão `Notification`, chama `pushManager.subscribe` com `PUBLIC_VAPID_PUBLIC_KEY` (`$env/static/public`), envia/remove subscription via fetch aos endpoints da API |
| UI | `apps/runes/src/routes/profile/+page.svelte` — botão "Ativar/Desativar notificações" com estado reativo baseado na permissão atual do `Notification.permission` |
| UI | [NEW] `apps/runes/src/lib/components/chat/NotificationsBanner.svelte` — banner contextual no chat sugerindo ativação quando `Notification.permission === 'default'` |
| Config | `.env.example` — adiciona `PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` com valores de exemplo (nota: gerar as reais com `npx web-push generate-vapid-keys`) |

### Payload de Push

Formato JSON enviado pelo backend via `web-push` e recebido pelo Service Worker no evento `push`:

**Tipo `chat`** (novas mensagens):
```json
{
  "type": "chat",
  "title": "<senderName>",
  "body": "<texto da mensagem truncado em 120 caracteres>",
  "url": "/chat/<roomId>",
  "data": { "roomId": "<id>", "roomName": "<roomName>" }
}
```

**Tipo `system`** (eventos genéricos de outros serviços):
```json
{
  "type": "system",
  "title": "<título customizado>",
  "body": "<descrição do evento>",
  "url": "<rota de destino>",
  "data": {}
}
```

### Interface de Disparo para Outros Serviços (RF5)

Função server-side exportada de `webPush.ts` para uso por qualquer form action ou módulo server:

```typescript
export async function sendSystemPush(
  userIds: string[],
  payload: { title: string; body: string; url: string }
): Promise<void>
```

`url` deve ser um path relativo same-origin (começar com `/`, sem `//` nem esquema); caso contrário `sendSystemPush` lança/ignora antes do envio. `title`+`body`+`url` serializados devem caber no limite de ~4KB do payload de push.

Exemplo de uso futuro em um form action do Kanban:
```typescript
// Em apps/runes/src/routes/kanban/+page.server.ts
import { sendSystemPush } from '$lib/server/webPush';

// Após atribuir um card a um usuário:
sendSystemPush([assigneeUserId], {
  title: 'Novo cartão atribuído',
  body: `Você foi atribuído ao cartão "${cardTitle}"`,
  url: '/kanban'
});
// fire-and-forget — sem await
```

## Contrato de API

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| POST | `/api/push/subscribe` | `{ endpoint: string, keys: { p256dh: string, auth: string } }` | `201 Created` (idempotente por `endpoint`) ou `400 Bad Request` |
| POST | `/api/push/unsubscribe` | `{ endpoint: string }` | `204 No Content` ou `400 Bad Request` |

## Alternativas consideradas

- **Notification API simples (sem Service Worker/Push)**, funcionando só enquanto a aba está aberta: mais simples de implementar, mas não atende ao requisito de funcionar com o app fechado — rejeitada conforme decisão explícita do usuário em favor do Push API completo.
- **Poller SSE / Long Polling customizado**: Substituiria a Push API para usuários com a aba aberta em segundo plano. Porém, não funcionaria se a aba estivesse fechada ou o celular bloqueado. A Push API nativa é a única que atende a esse cenário de forma autônoma.
- **Firebase Cloud Messaging (FCM)**: Facilitaria o envio e garantiria compatibilidade em dispositivos iOS mais antigos. Contudo, adiciona dependência de infraestrutura proprietária externa (Google Cloud / Firebase), violando o requisito explícito do usuário de push notification sem serviço externo.
- **`web-push` (npm)** foi escolhida por ser a lib de referência da comunidade para VAPID/Web Push, roda inteiramente no backend próprio (self-hosted), sem depender de nenhum serviço de terceiros (nada de Firebase/OneSignal).
- **Implementar VAPID/criptografia do payload (RFC 8291) manualmente com `node:crypto`**, sem lib de terceiros: evita uma dependência a mais, mas RFC 8291 (ECDH P-256 + HKDF + AES-128-GCM) é sutil e propenso a erros — o usuário decidiu permitir o uso de lib externa madura para essa parte, priorizando corretude e reduzindo esforço/risco.

## Questões em aberto

- **Remetente excluído em todos os próprios dispositivos**: RF3 exclui o remetente por `userId`, então enviar do celular também não notifica o notebook do mesmo usuário. Assumido como comportamento desejado; revisitar se surgir demanda por "notificar meus outros dispositivos".
- **Suporte ao Safari (iOS)**: A Push API é suportada no iOS Safari a partir da versão 16.4, mas exige que o app seja adicionado à tela inicial (PWA / Web Clip) em algumas versões do iOS. A documentação do usuário no App Hub deve deixar isso claro como limitação de plataforma, não do código do app.

## Links

- Jira (após aprovação da spec): [notifications.jira.md](../workflow/notifications.jira.md)
- Feature doc (pós-implementação): `docs/features/notifications.md`
- PR: `docs/workflow/notifications.pr.md`
- Depende de: [`chat-realtime`](./chat-realtime.md) (salas/mensagens), [`pocketbase-auth`](./pocketbase-auth.md)
- Specs relacionadas: [`chat-realtime`](./chat-realtime.md)
