# Push notifications de chat (runes)

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | Medium |
| Labels | sveltekit, ports-adapters, runes, pocketbase, push-notifications |
| Story Points | 5 |
| Jira Key | [JIRA-KEY] |
| Epic | _(opcional)_ |

## Description

### Contexto

Com o chat em tempo real (`chat-realtime`), mensagens novas só são vistas por quem está com a sala aberta. Usuários offline, em outra aba/rota, ou com o navegador fechado não são avisados. É necessário notificar via push do navegador, usando as APIs nativas no client (Notification API + Push API + Service Worker) e a lib `web-push` no backend (self-hosted, sem serviço externo) para VAPID/criptografia.

### Objetivo

Quando uma mensagem é criada em uma sala, todo participante que não seja o remetente e não esteja com aquela sala aberta e em foco recebe uma notificação push do sistema — inclusive com o app fechado — desde que tenha ativado notificações previamente.

### Escopo

**Incluído:**
- Botão explícito "Ativar notificações" (permissão + registro de Service Worker + `PushManager`)
- Par de chaves VAPID gerado com a lib `web-push`
- Coleção PocketBase `push_subscriptions`
- Endpoints para registrar/remover subscription
- Disparo de Web Push via `web-push` ao criar mensagem de chat, para os demais participantes, com payload `{ roomId, roomName, senderName, preview }`
- Service worker decide exibir/suprimir notificação via `clients.matchAll()` comparando `roomId` do payload com a URL das janelas focadas (sala aberta + aba em foco = suprime)
- Clique na notificação foca/abre a sala correspondente
- Múltiplas subscriptions por usuário (múltiplos dispositivos)
- Remoção automática de subscription inválida/expirada (404/410)

**Fora do escopo:**
- Notificações de outras origens além do chat
- Silenciar notificações por sala
- Contador de badge de não lidas persistente
- Garantia de suporte em navegadores com Push API limitada (ex.: Safari/iOS)

## Acceptance Criteria

- [ ] AC1: Dado um usuário que nunca ativou notificações, quando clica em "Ativar notificações" e concede permissão, então uma subscription é criada e associada a ele.
- [ ] AC2: Dado dois participantes numa sala, quando um envia mensagem e o outro não está com a sala aberta, então o outro recebe notificação do sistema com nome do remetente + preview.
- [ ] AC3: Dado um participante com a sala aberta e em foco, quando outro envia mensagem, então nenhuma notificação é exibida para quem está vendo a sala.
- [ ] AC4: Dado um participante com a sala aberta em aba sem foco, quando recebe mensagem, então a notificação é exibida.
- [ ] AC5: Dado um usuário com notificação exibida, quando clica nela, então a aba correspondente é focada/aberta na sala certa.
- [ ] AC6: Dado um usuário com subscription expirada, quando o push falha com 404/410, então a subscription é removida.
- [ ] Testes cobrindo a lógica de supressão/decisão de push com fakes, sem depender de push real
- [ ] `pnpm test` e `pnpm check` sem erros
- [ ] Documentação em `docs/features/chat-notifications.md`

## Technical Notes (Ports & Adapters — runes)

| Camada | Ação |
|--------|------|
| PocketBase | Migration `push_subscriptions` (`user`, `endpoint` único, `p256dh`, `auth_key`); API Rules restringindo acesso ao próprio usuário |
| Server | `apps/runes/src/lib/server/vapidKeys.ts`, `webPush.ts` (wrapper sobre a lib `web-push`), `pushSubscriptionStore.ts` |
| Server | Integração no `sendMessage` de `chat-realtime`: dispara `webPush.send()` de forma assíncrona/best-effort após criar a mensagem, com payload `{ roomId, roomName, senderName, preview }` |
| API | `apps/runes/src/routes/api/push/subscribe/+server.ts`, `api/push/unsubscribe/+server.ts` |
| Client | `apps/runes/src/service-worker.ts` (eventos `push`, `notificationclick`), `apps/runes/src/lib/client/pushNotifications.ts` (registro de SW + `pushManager.subscribe`) |
| UI | Botão "Ativar notificações" em `/chat` |
| Validação | `apps/runes/src/lib/validation/pushSchemas.ts` |
| Testes | `*.test.ts` cobrindo lógica de decisão de push (fake), sem depender de push real |

**Nota:** VAPID e criptografia do payload (RFC 8291) delegados à lib `web-push` (self-hosted, sem serviço externo) — não há implementação manual de criptografia nesta feature.

## Links

- Spec: `docs/specs/chat-notifications.md`
- Feature doc: `docs/features/chat-notifications.md`
- PR (após implementação): `docs/workflow/chat-notifications.pr.md`
- Depende de: `chat-realtime` (salas/mensagens), `pocketbase-auth`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks (opcional)

- [ ] Migration `push_subscriptions` + API Rules
- [ ] Adicionar dependência `web-push` + geração/gestão de chaves VAPID (`vapidKeys.ts`) via env vars
- [ ] `webPush.ts` — wrapper sobre `web-push` (configura VAPID details + `sendNotification`)
- [ ] `pushSubscriptionStore.ts` (CRUD) + endpoints `subscribe`/`unsubscribe`
- [ ] Service worker (`push`, `notificationclick`) + `pushNotifications.ts` client
- [ ] Integração no fluxo `sendMessage` do chat (disparo best-effort + limpeza de subscriptions inválidas)
- [ ] UI: botão "Ativar notificações"
- [ ] Testes unitários da lógica de supressão/decisão de push (fakes)
- [ ] Testes e2e/manuais: notificação com sala fechada, sala aberta sem foco, sala aberta com foco
- [ ] Documentação (`docs/features/chat-notifications.md`) + PR
