# Push notifications de chat (runes)

## Contexto

Com o chat em tempo real ([`chat-realtime`](./chat-realtime.md)), mensagens novas só são vistas por quem está com a sala aberta naquele momento. Usuários offline, em outra aba, em outra rota do app, ou com o navegador minimizado não são avisados de novas mensagens. É necessário notificar via push do navegador, usando as APIs nativas do navegador no client (Notification API + Push API + Service Worker) e, no backend, a lib `web-push` (self-hosted, sem depender de nenhum serviço externo tipo Firebase/OneSignal) para lidar com a assinatura VAPID e a criptografia do payload.

## Objetivo

Quando uma mensagem é criada em uma sala de chat, todo participante que não seja o remetente e que não esteja com aquela sala aberta e em foco recebe uma notificação push do sistema operacional/navegador — inclusive com o app fechado — desde que tenha ativado notificações previamente.

## Escopo

**Incluído:**

- Botão explícito "Ativar notificações" (dentro de `/chat`) que solicita permissão de `Notification` e registra Service Worker + `PushManager` subscription
- Par de chaves VAPID (pública/privada) gerado com a lib `web-push` (`webPush.generateVAPIDKeys()`), chave privada mantida só no servidor (env var)
- Coleção PocketBase `push_subscriptions` (usuário, endpoint, chaves `p256dh`/`auth`)
- Endpoints SvelteKit para registrar/remover uma subscription
- Ao criar uma mensagem de chat (fluxo de [`chat-realtime`](./chat-realtime.md)), o servidor dispara um Web Push via `web-push` (`webPush.sendNotification(...)`) para cada subscription registrada dos demais participantes
- Service worker do app trata o evento `push`: usa `clients.matchAll()` para decidir se alguma janela focada já está naquela sala (nesse caso, suprime a notificação); caso contrário, exibe a notificação com nome do remetente + preview da mensagem
- Clique na notificação (`notificationclick`) foca a aba existente na sala correspondente, ou abre uma nova
- Suporte a múltiplas subscriptions por usuário (múltiplos dispositivos/navegadores)
- Remoção automática de subscriptions inválidas/expiradas quando o push falha com 404/410

**Fora do escopo:**

- Notificações de outras origens além do chat (ex.: sistema, todo, admin) — a única origem hoje é mensagem de chat nova
- Configuração de "silenciar" notificações por sala específica
- Contador de badge de mensagens não lidas persistente
- Garantias de suporte em navegadores/plataformas com Push API limitada (ex.: Safari/iOS) — melhor esforço, sem fallback dedicado

## Requisitos funcionais

- RF1: Usuário autenticado ativa notificações clicando em um botão explícito; o navegador pede permissão nativa; se concedida, um Service Worker é registrado e uma `PushSubscription` é criada e vinculada ao usuário.
- RF2: Quando uma mensagem é criada em uma sala, o servidor identifica os participantes (exceto o remetente) com ao menos uma subscription registrada e dispara um Web Push via `web-push` para cada uma, com payload JSON `{ roomId, roomName, senderName, preview }` (`preview` = texto da mensagem truncado, ex.: 120 caracteres).
- RF3: O service worker, ao receber o push, lê `roomId` do payload e verifica via `clients.matchAll()` se existe uma janela focada cuja URL contém `/chat/{roomId}`; se sim, não exibe notificação; caso contrário, exibe a notificação do sistema usando `senderName` como título e `preview` como corpo.
- RF4: Ao clicar na notificação, o navegador foca a aba existente na sala (se houver) ou abre uma nova aba em `/chat/[roomId]`.
- RF5: Usuário pode ter múltiplas subscriptions ativas (múltiplos dispositivos/navegadores); todas recebem o push.
- RF6: Se o envio de um push falhar por subscription inválida/expirada (HTTP 404/410), o servidor remove o registro correspondente.
- RF7: Usuário que não é participante da sala nunca recebe notificação daquela sala.

## Requisitos não funcionais

- Par de chaves VAPID gerado uma única vez (via `web-push`); chave privada nunca exposta ao client, chave pública exposta apenas para `pushManager.subscribe`.
- Assinatura VAPID e criptografia do payload (RFC 8291) delegadas à lib `web-push`, que roda inteiramente no backend SvelteKit (self-hosted) — sem depender de nenhum serviço externo.
- Envio de push é best-effort/assíncrono: não deve bloquear nem atrasar a resposta da criação da mensagem para quem está enviando.
- Testes cobrindo a lógica de decisão de exibir/suprimir notificação e "quem deve receber push" com gateway/fake, sem depender de push real do navegador.

## Critérios de aceite

- [ ] AC1: Dado um usuário que nunca ativou notificações, quando clica em "Ativar notificações" e concede permissão, então uma subscription é criada e associada a ele.
- [ ] AC2: Dado dois participantes numa sala, quando um envia uma mensagem e o outro não está com a sala aberta, então o outro recebe uma notificação do sistema com nome do remetente e preview da mensagem.
- [ ] AC3: Dado um participante com a sala aberta e a aba em foco, quando outro participante envia uma mensagem, então nenhuma notificação é exibida para quem está vendo a sala.
- [ ] AC4: Dado um participante com a sala aberta, mas em outra aba sem foco, quando recebe uma mensagem, então a notificação é exibida.
- [ ] AC5: Dado um usuário com notificação exibida, quando clica nela, então a aba correspondente é focada/aberta na sala certa.
- [ ] AC6: Dado um usuário com subscription expirada, quando o push falha com 404/410, então a subscription é removida do banco.
- [ ] Testes cobrindo a lógica de supressão/decisão de push com fakes, sem depender de push real do navegador.

## Design (Ports & Adapters — padrão runes)

| Camada | Mudança prevista |
|--------|-------------------|
| PocketBase | Migration cria `push_subscriptions` (`user` relation → `auth` required, `endpoint` text required único, `p256dh` text required, `auth_key` text required) |
| PocketBase | API Rules `push_subscriptions`: `listRule`/`viewRule`/`deleteRule` = `user = @request.auth.id`; `createRule` = `@request.auth.id != '' && user = @request.auth.id`; `updateRule` = `false` |
| Server | `apps/runes/src/lib/server/vapidKeys.ts` (lê/valida chaves VAPID a partir de env vars) |
| Server | `apps/runes/src/lib/server/webPush.ts` (wrapper fino sobre a lib `web-push`: configura VAPID details e chama `sendNotification` para cada subscription) |
| Server | `apps/runes/src/lib/server/pushSubscriptionStore.ts` (CRUD de subscriptions no PocketBase) |
| Server | Integração no fluxo `sendMessage` de [`chat-realtime`](./chat-realtime.md): após criar a mensagem, dispara `webPush.send()` para participantes elegíveis com payload `{ roomId, roomName, senderName, preview }` |
| API | `apps/runes/src/routes/api/push/subscribe/+server.ts` (POST: registra subscription) |
| API | `apps/runes/src/routes/api/push/unsubscribe/+server.ts` (POST: remove subscription) |
| Client | `apps/runes/src/service-worker.ts` (Service Worker do SvelteKit: eventos `push` e `notificationclick`) |
| Client | `apps/runes/src/lib/client/pushNotifications.ts` (registra SW, pede permissão, chama `pushManager.subscribe` com a chave pública VAPID, envia subscription ao servidor) |
| UI | Botão "Ativar notificações" dentro de `ChatRoomList.svelte`/layout de `/chat` |
| Validação | `apps/runes/src/lib/validation/pushSchemas.ts` (`subscriptionSchema`: `endpoint`, `keys`) |

## Contrato de API (se houver)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| POST | `/api/push/subscribe` | `{ endpoint, keys: { p256dh, auth } }` | `201` ou `fail(400)` |
| POST | `/api/push/unsubscribe` | `{ endpoint }` | `204` |

## Alternativas consideradas

- **Notification API simples (sem Service Worker/Push)**, funcionando só enquanto a aba está aberta: mais simples de implementar, mas não atende ao requisito de funcionar com o app fechado — rejeitada nesta rodada, conforme decisão explícita do usuário em favor do Push API completo.
- **Implementar VAPID/criptografia do payload (RFC 8291) manualmente com `node:crypto`**, sem lib de terceiros: evita uma dependência a mais, mas RFC 8291 (ECDH P-256 + HKDF + AES-128-GCM) é sutil e propenso a erros — o usuário decidiu permitir o uso de lib externa madura para essa parte, priorizando corretude e reduzindo esforço/risco.
- **`web-push` (npm)** foi escolhida por ser a lib de referência da comunidade para VAPID/Web Push, roda inteiramente no backend próprio (self-hosted), sem depender de nenhum serviço de terceiros (nada de Firebase/OneSignal).

## Questões em aberto

- Comportamento em navegadores/SOs com Push API limitada (ex.: Safari com restrições) não está coberto nesta spec — melhor esforço, sem fallback definido.

## Links

- Jira (após aprovação da spec): `docs/workflow/chat-notifications.jira.md`
- Feature doc (pós-implementação): `docs/features/chat-notifications.md`
- PR: `docs/workflow/chat-notifications.pr.md`
- Depende de: [`chat-realtime`](./chat-realtime.md) (salas/mensagens), [`pocketbase-auth`](./pocketbase-auth.md)
- Specs relacionadas: [`chat-realtime`](./chat-realtime.md)
