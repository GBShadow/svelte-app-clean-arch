# Notificações Push (Self-Hosted)

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | High |
| Labels | sveltekit, ports-adapters, runes, web-push, service-worker |
| Story Points | 5 |
| Jira Key | [JIRA-KEY] |
| Epic | Infraestrutura & Comunicação |

## Description

### Contexto

Atualmente, o monorepo de chat em tempo real não envia notificações quando o usuário receptor está fora da sala aberta, em outra aba ou offline. Além disso, outros fluxos do sistema (como Kanban ou tarefas agendadas) precisam de uma infraestrutura assíncrona comum para enviar alertas no padrão self-hosted (sem serviços pagos/externos).

Esta história de usuário visa estabelecer a infraestrutura nativa de Web Push, criando uma coleção de assinaturas no PocketBase e integrando o envio assíncrono no backend via biblioteca `web-push`. A nível de cliente, o Service Worker fará a triagem e exibição adequada de notificações de chat (aplicando supressão na aba focada correspondente) e notificações de sistema gerais.

### Objetivo

Disponibilizar a infraestrutura geral de notificações push no app `runes`, entregando a integração no fluxo de novas mensagens de chat e um canal reutilizável para disparo de eventos do sistema.

### Escopo

**Incluído:**
- Configuração de chaves VAPID seguras no backend (env vars `PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- Migration da coleção PocketBase `push_subscriptions` com API Rules rígidas (posse do próprio registro para listagem/leitura/criação/exclusão, `updateRule = null`, `endpoint` único).
- Par de endpoints SvelteKit `/api/push/subscribe` (idempotente por `endpoint`, delete-then-create) e `/api/push/unsubscribe`, ambos usando `locals.pb` (respeitam as API Rules de posse — defesa em profundidade real, não só checagem no código).
- Helper client-side `pushSubscription.ts` para solicitar permissão, registrar SW, inscrever/desinscrever e sincronizar com o backend.
- Service Worker (`service-worker.ts`) com suporte a eventos `push` e `notificationclick`, delegando a decisão de supressão à função pura `pushDecision.ts` (`shouldSuppressChatPush`) e a validação de URL a `pushPayload.ts` (`isSafeRedirectUrl`).
- Módulo de domínio puro `pushPayload.ts` (truncamento do preview em 120 caracteres, validação de URL same-origin, montagem dos payloads `chat`/`system`) — testável sem mocks.
- Três módulos server-side: `vapidKeys.ts` (leitura de env vars), `webPush.ts` (wrapper fino `web-push` + `sendChatPush`/`sendSystemPush`), `pushSubscriptionStore.ts` (leitura por userId e limpeza de subscriptions inválidas via `getAdminClient()` — só usado no contexto do remetente/RF8, não no cadastro/remoção pelo próprio usuário).
- Integração da ativação/desativação de notificações na tela de perfil do usuário (`/profile`, com estado "bloqueado" quando `Notification.permission === 'denied'`) e um banner (`NotificationsBanner.svelte`) na listagem de chats.
- Integração fire-and-forget do disparo de push no action `sendMessage` do chat.
- Limpeza automática de subscriptions inválidas (erros 404/410) via `getAdminClient()`.

**Fora do escopo:**
- Silenciamento granular por sala de chat ou por tags.
- Configuração de horas de silêncio (do not disturb).

## Acceptance Criteria

- [x] AC1: Dado um usuário autenticado, quando ele acessa `/profile` e clica em "Ativar notificações", então o navegador exibe a solicitação de permissão nativa. Se concedida, o Service Worker é instalado, a assinatura VAPID é gerada e gravada com sucesso na tabela `push_subscriptions` do PocketBase. *(verificado via chamada HTTP real a `/api/push/subscribe` autenticado — 201.)*
- [x] AC2: Dado um usuário com múltiplas sessões em dispositivos diferentes (ex: celular e notebook), quando ele recebe uma notificação, então todos os dispositivos registrados recebem e exibem o push. *(`getSubscriptionsForUsers` retorna todas as subscriptions do usuário; `dispatchToSubscriptions` despacha para todas via `Promise.allSettled`.)*
- [x] AC3: Dado dois participantes em uma sala de chat, quando o Usuário A envia uma mensagem e o Usuário B está com a respectiva sala de chat aberta e focada, então o Service Worker intercepta o push e suprime a notificação nativa para não perturbar o usuário na tela ativa. *(`shouldSuppressChatPush` — testado.)*
- [x] AC4: Dado dois participantes em uma sala de chat, quando o Usuário A envia uma mensagem e o Usuário B está com o navegador minimizado, em outra aba ou em outra página do app, então o sistema operacional exibe uma notificação push informando o nome do remetente e o preview da mensagem (truncado em 120 caracteres). *(`buildChatPushPayload`/`truncateMessage` — testado.)*
- [x] AC5: Dado um participante com a sala aberta mas **em outra aba sem foco**, quando outro participante envia uma mensagem, então a notificação push é exibida normalmente (a supressão só ocorre com a aba focada). *(testado em `pushDecision.test.ts`.)*
- [x] AC6: Dado um usuário que recebe uma notificação push do app (seja chat ou sistema), quando ele clica nela, então o navegador foca a aba existente do app ou abre uma nova aba direcionada para a URL do payload.
- [x] AC7: Dado um usuário com assinatura expirada ou cancelada, quando o backend tenta disparar um push e recebe o erro HTTP 404 ou 410 do gateway Push do navegador, então o backend remove essa assinatura inválida da coleção `push_subscriptions` do PocketBase via `getAdminClient()`.
- [x] AC8: Dado um usuário com notificações ativas, quando ele clica em "Desativar notificações" na tela de Perfil, então a assinatura do dispositivo atual é removida do PocketBase e o `PushManager` do navegador é revogado. *(verificado via `/api/push/unsubscribe` — 204.)*
- [x] AC9: Dado um usuário que **não** é participante de uma sala de chat, quando uma mensagem é enviada nessa sala, então nenhum push é disparado para ele, mesmo que possua assinaturas ativas. *(`recipientUserIds` deriva de `room.participants`, nunca de todos os usuários.)*
- [x] AC10: Dado um dispositivo que já possui assinatura registrada, quando o usuário reativa/reassina (mesmo `endpoint`), então o cadastro é idempotente (delete-then-create) e não falha por conflito de unicidade. *(verificado via HTTP real: dois POSTs consecutivos ao mesmo endpoint retornaram 201/201, sem erro de unicidade.)*
- [x] AC11: Dado um usuário com `Notification.permission === 'denied'`, quando ele abre a tela de Perfil, então é exibido o estado "bloqueado" com instrução de reabilitação manual, sem disparar prompt programático.
- [x] AC12: Dado um usuário que conhece o `endpoint` da assinatura de outro usuário, quando chama `/api/push/unsubscribe` com esse endpoint, então a `deleteRule` de posse impede a remoção da assinatura alheia. *(verificado via HTTP real contra o PocketBase: delete cross-user retornou 404, sem vazar a existência do registro.)*
- [x] Testes unitários rodando via `pnpm test` (134 testes) e checagens estáticas passando sem erros via `pnpm check` (0 erros).

## Technical Notes (Ports & Adapters — runes)

| Camada | Ação |
|--------|------|
| PocketBase | `pocketbase/pb_migrations/0018_create_push_subscriptions_collection.js` — cria `push_subscriptions` (`endpoint` único) com API Rules de posse (`listRule`/`viewRule`/`deleteRule` = `user = @request.auth.id`; `createRule` valida `@request.body.user = @request.auth.id`; `updateRule = null`). |
| Domínio (função pura) | `apps/runes/src/lib/domain/pushPayload.ts` — `truncateMessage`, `isSafeRedirectUrl`, `buildChatPushPayload`, `buildSystemPushPayload`. |
| Server (types) | `apps/runes/src/lib/server/pushRecord.ts` — Definição do record `PushSubscriptionRecord`. |
| Server (VAPID) | `apps/runes/src/lib/server/vapidKeys.ts` — Carregamento de `PUBLIC_VAPID_PUBLIC_KEY` (`$env/static/public`), `VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` (`$env/static/private`). |
| Server (web-push) | `apps/runes/src/lib/server/webPush.ts` — Wrapper sobre `web-push`: configura VAPID, expõe `sendChatPush()` e `sendSystemPush()`, trata erros 404/410 delegando remoção ao store. |
| Server (store) | `apps/runes/src/lib/server/pushSubscriptionStore.ts` — `getSubscriptionsForUsers()` (leitura) e `removeInvalidSubscription()` (RF8), ambos via `getAdminClient()` — só usado no contexto do remetente/serviço, nunca no cadastro/remoção pelo próprio dono. |
| Server (integração) | `apps/runes/src/routes/chat/[roomId]/+page.server.ts` — Chamada fire-and-forget de `sendChatPush()` no action `sendMessage` após criar a mensagem. |
| Validação | `apps/runes/src/lib/validation/pushSchemas.ts` — Schemas Zod `subscribeSchema` e `unsubscribeSchema`. |
| API | `apps/runes/src/routes/api/push/subscribe/+server.ts` (idempotente, delete-then-create) e `unsubscribe/+server.ts` — usam `locals.pb`, não `getAdminClient()`. |
| Client (pura) | `apps/runes/src/lib/client/pushDecision.ts` — `shouldSuppressChatPush()`, testável sem mocks de `self`. |
| Client (SW) | `apps/runes/src/service-worker.ts` — `push` (delega supressão a `pushDecision.ts`, valida url via `pushPayload.ts`) e `notificationclick` (foca/abre aba). |
| Client | `apps/runes/src/lib/client/pushSubscription.ts` — Registro de SW, permissão, `pushManager.subscribe` com `PUBLIC_VAPID_PUBLIC_KEY`, comunicação com endpoints. |
| UI | `apps/runes/src/routes/profile/+page.svelte` — Botão "Ativar/Desativar notificações" com estados `loading`/`unsupported`/`denied`/`subscribed`/`default`. |
| UI | `apps/runes/src/lib/components/chat/NotificationsBanner.svelte` — Banner contextual na listagem `/chat`. |
| Config | `.env.example` — Adiciona `PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. |
| Testes | `pushPayload.test.ts`, `pushDecision.test.ts`, `pushSchemas.test.ts` — lógica pura testada; `webPush.ts`/`pushSubscriptionStore.ts` seguem a convenção do projeto de wrappers `lib/server/*` sem teste unitário direto (verificados manualmente contra PocketBase/dev server real). |

## Links

- Spec: [notifications.md](../specs/notifications.md)
- Feature doc (após implementação): `docs/features/notifications.md`
- PR (após implementação): `docs/workflow/notifications.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

- [x] **Subtask 1: Infraestrutura do Banco e Configurações**
  - Gerar chaves VAPID reais (`web-push generate-vapid-keys`) e configurar `PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` em `.env` / `.env.example`.
  - Criar migration `0018_create_push_subscriptions_collection.js` e aplicar as API Rules restritivas (`updateRule = null`).
- [x] **Subtask 2: Módulos Server-Side**
  - `vapidKeys.ts`, `pushRecord.ts`, `pushSubscriptionStore.ts`, `webPush.ts`.
  - `pushPayload.ts` (domínio puro, extraído para viabilizar testes sem mocks de rede/PocketBase).
- [x] **Subtask 3: API Endpoints & Validadores**
  - `pushSchemas.ts` (`subscribeSchema`, `unsubscribeSchema`).
  - `/api/push/subscribe` (idempotente) e `/api/push/unsubscribe`, via `locals.pb`.
- [x] **Subtask 4: Service Worker e Supressão**
  - `service-worker.ts` com eventos `push`/`notificationclick`.
  - `pushDecision.ts` (`shouldSuppressChatPush`) isolado para ser testável.
- [x] **Subtask 5: UI & Client Integration**
  - `pushSubscription.ts`, botão "Ativar/Desativar" em `/profile` (com estado bloqueado), `NotificationsBanner.svelte`, integração fire-and-forget no `sendMessage`.
- [x] **Subtask 6: Testes & Documentação**
  - `pushPayload.test.ts`, `pushDecision.test.ts`, `pushSchemas.test.ts` (inclui allowlist de hosts de `endpoint` contra SSRF, achado por revisão de segurança automatizada e corrigido nesta mesma implementação).
  - `pnpm test` (139 testes) e `pnpm check` (0 erros) verificados.
  - Verificação manual end-to-end contra PocketBase + dev server real: migration/API Rules (IDOR, updateRule bloqueado), idempotência de `/api/push/subscribe`, fluxo completo de `sendMessage` com push best-effort.
  - Atualizar feature doc, changelog, CODE-STRUCTURE.md e specs/README.md.
