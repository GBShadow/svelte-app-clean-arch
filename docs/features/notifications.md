# Notificações Push (Self-Hosted)

## Resumo

Infraestrutura de Web Push nativa (Notification API + Push API + Service Worker), totalmente
self-hosted via `web-push`/VAPID — sem dependência de serviços de terceiros (Firebase/OneSignal).
Cobre dois casos: notificação de novas mensagens de chat (com supressão inteligente quando a sala
já está aberta e focada) e um canal genérico (`sendSystemPush`) reutilizável por qualquer outro
fluxo do sistema (ex.: Kanban).

## App(s) afetado(s)

runes

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| PocketBase | `pocketbase/pb_migrations/0018_create_push_subscriptions_collection.js` |
| Domínio (puro) | `apps/runes/src/lib/domain/pushPayload.ts` |
| Server | `apps/runes/src/lib/server/{pushRecord,vapidKeys,pushSubscriptionStore,webPush}.ts` |
| Validação | `apps/runes/src/lib/validation/pushSchemas.ts` |
| API | `apps/runes/src/routes/api/push/{subscribe,unsubscribe}/+server.ts` |
| Client (puro) | `apps/runes/src/lib/client/pushDecision.ts` |
| Client | `apps/runes/src/lib/client/pushSubscription.ts`, `apps/runes/src/service-worker.ts` |
| UI | `apps/runes/src/routes/profile/+page.svelte`, `apps/runes/src/lib/components/chat/NotificationsBanner.svelte` |
| Integração | `apps/runes/src/routes/chat/[roomId]/+page.server.ts` (action `sendMessage`) |
| Config | `.env.example` (`PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`), `apps/runes/package.json` (`web-push`) |

## Fluxo (Ports & Adapters)

**Cadastro (RF1):** `/profile` → `pushSubscription.ts` (`Notification.requestPermission` →
`registration.pushManager.subscribe` com `PUBLIC_VAPID_PUBLIC_KEY`) → `POST /api/push/subscribe`
(`locals.pb`, idempotente por `endpoint`) → PocketBase `push_subscriptions`.

**Disparo de chat (RF3):** `chat/[roomId]/+page.server.ts` (`sendMessage`) → cria a mensagem →
`sendChatPush()` fire-and-forget (sem `await`) → `pushSubscriptionStore.getSubscriptionsForUsers()`
(via `getAdminClient()`, contexto do remetente) → `webpush.sendNotification()` por subscription.

**Recepção (RF4/RF6):** `service-worker.ts` (`push` event) → parse do payload → se `type === 'chat'`,
`shouldSuppressChatPush()` (domínio puro `pushDecision.ts`) decide supressão a partir de
`clients.matchAll()`; se `type === 'system'`, exibe sempre → `registration.showNotification()`.

**Clique (RF7):** `service-worker.ts` (`notificationclick`) → valida `url` via `isSafeRedirectUrl`
(`pushPayload.ts`) → foca aba existente ou `clients.openWindow()`.

**Canal genérico (RF5):** qualquer form action server-side pode chamar
`sendSystemPush(userIds, { title, body, url })` de `webPush.ts`.

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/push/subscribe` | `{ endpoint, keys: { p256dh, auth } }` → `201` (idempotente por `endpoint`) ou `400` |
| POST | `/api/push/unsubscribe` | `{ endpoint }` → `204` (idempotente) ou `400` |

## Como testar

```bash
pnpm test    # pushPayload.test.ts, pushDecision.test.ts, pushSchemas.test.ts
pnpm check
pnpm dev:full
```

Manual: `/profile` → "Ativar notificações" → conceder permissão no navegador → enviar mensagem de
outra conta em uma sala compartilhada → observar supressão com a aba focada na sala e exibição da
notificação nativa quando a aba está minimizada/sem foco/em outra rota.

### Verificação realizada nesta implementação

Além de `pnpm test` (134 testes) e `pnpm check` (0 erros), a migration e os endpoints foram
validados com chamadas HTTP reais contra um PocketBase e um dev server (`vite dev`) efetivamente
rodando (não apenas leitura de código):

- **Anti-IDOR da coleção** (`push_subscriptions`): usuário não consegue criar registro se passando
  por outro (`createRule` → `400`), não vê nem apaga assinatura alheia via `list`/`delete`
  (`404`, sem vazar existência), e `update` é bloqueado para qualquer não-superusuário (`403`,
  `updateRule = null`).
- **Idempotência de `/api/push/subscribe`**: dois `POST` consecutivos ao mesmo `endpoint` retornam
  `201`/`201`, sem conflito de unicidade.
- **`/api/push/unsubscribe`**: remove a assinatura própria (`204`) e é idempotente para um
  `endpoint` já removido (`204`, sem erro).
- **Endpoints exigem autenticação**: chamada sem sessão é bloqueada pelo `hooks.server.ts`
  (redirect `303`) antes mesmo de chegar ao handler.
- **Fluxo completo de chat**: criação de sala com dois usuários reais, assinatura de push (endpoint
  fake) pelo segundo usuário, envio de mensagem pelo primeiro — o disparo fire-and-forget falha
  silenciosamente contra o endpoint fake (esperado) sem afetar o retorno `success` da action nem
  gerar erro não tratado no servidor.

Todos os dados de teste (sala, usuários, subscriptions) foram removidos ao final da verificação.

## Decisões de design

1. **`locals.pb`, não `getAdminClient()`, no cadastro/remoção pelo próprio usuário.** A primeira
   versão da spec cogitava usar o cliente superusuário para todo o CRUD de `push_subscriptions`,
   o que bypassaria as API Rules de posse (`.cursor/rules/architecture/pocketbase-api-rules.mdc`).
   Decisão: `/api/push/subscribe`/`unsubscribe` usam `locals.pb`, deixando o PocketBase — não só o
   código do endpoint — como camada de defesa contra IDOR. `getAdminClient()` fica restrito à
   limpeza do RF8, onde o remetente genuinamente não é dono da subscription.
2. **`PUBLIC_VAPID_PUBLIC_KEY` em vez de `VAPID_PUBLIC_KEY`.** A chave pública precisa chegar ao
   `pushManager.subscribe()` no browser; SvelteKit só expõe env vars ao client com o prefixo
   `PUBLIC_` (`$env/static/public`). Sem o prefixo, a spec original não fechava tecnicamente.
3. **Lógica pura extraída de `service-worker.ts` e `webPush.ts`.** `shouldSuppressChatPush`
   (`pushDecision.ts`) e a formatação/validação de payload (`pushPayload.ts`) vivem fora de
   `lib/server`/do próprio Service Worker para serem testáveis no Vitest sem mocks de `self`,
   `clients` ou da lib `web-push`. `webPush.ts`/`pushSubscriptionStore.ts` seguem a convenção já
   estabelecida no projeto para wrappers finos de integração externa (`kanbanHistory.ts`,
   `authExpand.ts`): sem teste unitário direto, verificados manualmente/via e2e.
4. **Idempotência de `/api/push/subscribe` via delete-then-create.** `endpoint` é único e
   `updateRule = null`; sem esse tratamento, reassinar o mesmo dispositivo (rotação de chaves,
   permissão reconcedida) falharia com conflito de unicidade.
5. **Validação de URL same-origin (`isSafeRedirectUrl`).** `sendSystemPush` aceita uma `url`
   arbitrária vinda de qualquer chamador futuro; sem validar que é um path relativo same-origin, um
   payload malicioso poderia direcionar `clients.openWindow()`/foco para fora do app.
6. **Allowlist de hosts em `subscribeSchema.endpoint` (SSRF).** `endpoint` é gravado pelo usuário e
   depois se torna o destino de um `POST` feito pelo *servidor* (`webpush.sendNotification`). Sem
   restrição, um usuário autenticado poderia registrar um `endpoint` interno (`127.0.0.1:8090`,
   metadata endpoint de nuvem) e o backend faria a requisição por ele. `pushSchemas.ts` valida
   `endpoint` contra uma allowlist dos hosts de push dos navegadores suportados, exigindo `https:` e
   comparando o hostname por igualdade/subdomínio real (não `includes`, contornável com
   `fcm.googleapis.com.evil.com`). Encontrado por revisão de segurança automatizada após a primeira
   versão da implementação; corrigido com `isAllowedPushEndpoint()` + 5 novos testes em
   `pushSchemas.test.ts`.

## Questões em aberto (herdadas da spec)

- **Suporte ao Safari (iOS)**: Push API exige iOS 16.4+ e, em algumas versões, que o app esteja
  instalado como PWA/Web Clip — limitação de plataforma, não do código.
- **Remetente excluído em todos os próprios dispositivos**: comportamento assumido como desejado
  (ver spec); revisitar se surgir demanda por "notificar meus outros dispositivos".
