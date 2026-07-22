# Campanha de Testes — Cobertura Total (Unit, E2E, Interação, Segurança)

Created: 2026-07-22

## Contexto

O projeto tem testes espalhados por várias camadas, mas sem cobertura sistemática. O domínio está bem coberto (~117 testes em 10 arquivos), mas:

- **Client**: 6/8 arquivos sem teste (accent, toast, notifications, pushSubscription, pocketbaseClient, enhanceWithToast)
- **Server**: 20 arquivos 100% excluídos do vitest (decisão arquitetural, cobertura apenas via e2e)
- **E2E**: 8 specs cobrindo ~21 cenários, mas Projects, Notifications, Profile zero cobertura
- **Infra**: `@vitest/coverage-v8` não instalado, sem métricas 
- **Segurança**: nunca auditada sistematicamente — a auditoria desta spec encontrou 2 falhas ALTA no Kanban (addComment, createCard/updateCard/moveCard sem verificação de escopo de projeto)

A campanha precisa cobrir todas essas lacunas em fases executáveis, com autorização separada para cada fase.

## Objetivo

Cobertura de testes >= 80% nas camadas domain/validation/client, cobertura e2e de TODAS as rotas, 0 falhas de segurança conhecidas sem correção, e workflow de manutenção contínua.

## Escopo

**Incluído:**
- Todas as fases da campanha (0 a 9) conforme detalhado abaixo
- Testes unitários para todas as funções puras (domain, validation, client)
- Testes e2e para todas as rotas não cobertas atualmente
- Testes de interação (teclado, acessibilidade, drag-and-drop)
- Testes de segurança (IDOR, XSS, realtime bypass)
- Infraestrutura de coverage e CI gates
- Correção das falhas de segurança encontradas na auditoria

**Fora do escopo:**
- Testes de carga/performance
- Testes visuais (screenshot regression)
- Testes de mobile/responsivo dedicados (cobertos incidentalmente pelo Playwright em viewport 1280x720)
- Testes de integração com PocketBase real (já cobertos por e2e)
- Testes de compatibilidade cross-browser (apenas Chromium)

## Impactos e Dependências

- **Features existentes afetadas:** Todas — a campanha adiciona testes sem alterar produção
- **Dívida técnica existente relacionada:** Nenhuma diretamente; a auditoria de segurança encontrou 2 débitos que serão registrados em TECH-DEBT.md e corrigidos durante a campanha
- **Dependências:** `@vitest/coverage-v8` precisa ser instalado (Fase 1)
- **Specs relacionadas:** Nenhuma — é a primeira spec de testes do projeto

## Requisitos funcionais

- RF1: Toda função pura em `src/lib/domain/` deve ter teste unitário correspondente
- RF2: Toda função pura em `src/lib/validation/` deve ter teste unitário correspondente
- RF3: Toda store reativa em `src/lib/client/` deve ter teste unitário correspondente
- RF4: Toda server action em `src/routes/**/+page.server.ts` deve ter teste e2e ou de autorização
- RF5: Toda rota de página deve ter teste e2e cobrindo o fluxo happy path
- RF6: Toda falha de segurança identificada na auditoria deve ter teste que a comprove (antes da correção) e teste que a valide (depois da correção)
- RF7: O sistema de coverage deve reportar percentual por camada
- RF-TDD: **Todo código de produção deve ser precedido pelo teste que o exige** (Red-Green-Refactor). Nenhuma implementação é aceita sem o teste correspondente escrito primeiro.

## Requisitos não funcionais

- **Segurança**: Cada fase inclui verificação de segurança específica da camada. A Fase 7 é dedicada a testes de segurança (pentest automatizado). As falhas ALTA encontradas na auditoria são corrigidas ANTES de qualquer outra fase.
- **Manutenibilidade**: Testes seguem os padrões já estabelecidos (domínio puro sem mocks, validação com Zod safeParse, e2e com data-testid).
- **Performance**: A bateria completa de testes unitários não deve exceder 30s. E2E não deve exceder 5min.
- **Isolamento**: Testes unitários não dependem de banco, rede ou PocketBase. E2E usa seed dedicado e cleanup.

## Casos de Borda e Cenários de Erro

- **Concorrência:** Testes e2e rodam sequencialmente (1 worker) — não cobre concorrência real
- **Dados inconsistentes:** Mocks e fixtures garantem estado conhecido
- **Timeout / falha de rede:** Coberto por testes de validação (Zod) e cenários de erro em e2e
- **Estado vazio:** Testado em e2e para cada rota
- **Permissão negada:** Testado em e2e com dois usuários distintos (admin + comum)
- **Input inválido / malicioso:** Coberto por testes de validação + testes de XSS
- **Sessão expirada:** Testado em e2e (auth-cross-tab já cobre logout)

## Critérios de aceite

- [ ] Auditoria de segurança concluída e débitos registrados em TECH-DEBT.md (Fase 0)
- [ ] Falhas de segurança ALTA corrigidas e validadas com teste (pré-requisito)
- [ ] `@vitest/coverage-v8` instalado e configurado, `pnpm test:coverage` funcional (Fase 1)
- [ ] `projectSchemas.test.ts` criado com cobertura de todos os schemas (Fase 2)
- [ ] `toast.svelte.ts`, `accent.svelte.ts`, `enhanceWithToast.ts` com testes (Fase 3)
- [ ] `notifications.svelte.ts`, `pushSubscription.ts` com testes (Fase 3)
- [ ] `richTextSanitize.test.ts`, `webPush.test.ts`, `notificationStore.test.ts` criados (Fase 4)
- [ ] `kanbanHistory.test.ts`, `authExpand.test.ts`, `authLookup.test.ts` criados (Fase 4)
- [ ] `hooks.server.test.ts` e `service-worker.test.ts` criados ou viabilidade documentada (Fase 5)
- [ ] E2E Projects (4 rotas) — cobertura completa (Fase 6)
- [ ] E2E Notifications (1 rota página + 5 rotas API) — cobertura completa (Fase 6)
- [ ] E2E Profile (1 rota) — cobertura completa (Fase 6)
- [ ] Testes de IDOR entre usuários para chat, kanban, poker, todo (Fase 7)
- [ ] Testes de XSS via rich text editor (Fase 7)
- [ ] Testes de keyboard navigation e focus management (Fase 8)
- [ ] CI gates configurados com coverage threshold mínimo (Fase 9)
- [ ] `pnpm test` passa antes da abertura do PR.

## Design

### Plano de Fases

```
Fase 0: Spec + Auditoria de Segurança (ESTAMOS AQUI)
Fase 1: Infraestrutura de Cobertura (@vitest/coverage-v8 + thresholds)
Fase 2: Validação (Zod) — projectSchemas.test.ts
Fase 3: Client-Side — toast, accent, enhanceWithToast, notifications, pushSubscription
Fase 4: Server-Side — richTextSanitize, webPush, notificationStore, kanbanHistory, authExpand, authLookup
Fase 5: Hooks + Service Worker
Fase 6: Expansão E2E — Projects, Notifications, Profile, Poker backlog
Fase 7: Testes de Segurança — IDOR, XSS, realtime bypass, API Rules validation
Fase 8: Interação e Acessibilidade — keyboard nav, focus, drag-and-drop
Fase 9: Estratégia de Manutenção — CI gates, pre-commit, workflow doc
```

### Achados da Auditoria de Segurança (Fase 0)

#### ALTA PRIORIDADE — Corrigir antes da Fase 1

1. **`kanban/+page.server.ts` — `addComment`**: Nenhuma verificação de permissão além de `!!locals.user`. Qualquer autenticado comenta em qualquer card de qualquer projeto.
   - **Local:** `apps/runes/src/routes/kanban/+page.server.ts:695`
   - **Correção:** Carregar card, obter `project`, verificar `canViewProject(locals.user, project)` antes de inserir comentário.

2. **`kanban/+page.server.ts` — `createCard` / `updateCard` / `moveCard`**: `canCreateCard(userId)` e `canUpdateCard(userId)` retornam `true` para qualquer `userId` definido. Qualquer autenticado cria/edita/move cards em projetos que não participa.
   - **Local:** `apps/runes/src/lib/domain/kanbanAccess.ts:3-6`
   - **Correção:** As funções precisam receber o `project` como parâmetro e verificar se o usuário é participante do projeto (`isProjectParticipant` ou similar).

#### MÉDIA PRIORIDADE

3. **Coleção `sprints` — `createRule`/`updateRule`/`deleteRule` excessivamente permissivas**: `"@request.auth.isAdmin = true || @request.auth.id != ''"` — qualquer autenticado cria/altera/deleta sprints. A correção via server actions (projects/[id]) mitiga, mas chamada direta à API permite que qualquer usuário crie sprints soltas.
   - **Local:** `pocketbase/pb_migrations/0021_create_projects_sprints.js`
   - **Correção:** Restringir rules para `"project.responsaveis ?= @request.auth.id || @request.auth.isAdmin = true"` (ou similar).

## Contrato de API

_Não se aplica — a campanha não expõe novos endpoints._

## Alternativas consideradas

1. **Testes end-to-end vs unitários**: A opção de depender apenas de e2e (como é feito hoje para server layer) foi rejeitada porque e2e são lentos (~3min a bateria), frágeis (requerem PocketBase rodando), e não permitem teste de borda/corner cases. A abordagem é: lógica pura (domain/validation/client) → unit tests; integração (server/API) → e2e + unit tests seletivos; fluxo completo → e2e.
2. **Coverage provider**: `v8` vs `istanbul`. V8 é mais rápido e não precisa de transpilação extra. Como o projeto usa Vitest (não Jest), `@vitest/coverage-v8` é a escolha natural.
3. **Component testing (vitest-browser)**: Considerado para testar componentes Svelte isoladamente, mas rejeitado nesta campanha porque (a) exigiria configurar `@vitest/browser` + Playwright, (b) a maioria dos componentes são "thin" (só renderizam estado), (c) a interação real já é coberta por e2e. Pode ser revisitado na Fase 8 se houver componentes complexos demais para e2e.

## Análise de Risco e Dívida Técnica

- **Riscos identificados:** 
  - A correção das 2 falhas de segurança ALTA no Kanban pode ter efeito colateral em fluxos existentes (ex: notificações de kanban disparam para assignees, que são participantes do projeto — se a verificação de projeto quebrar, notificações podem parar de funcionar)
  - Testes de server layer exigem mocking do `locals.pb` — frágil se o SDK do PocketBase mudar
- **Dívida técnica aceita:** 
  - Não testar `pocketbaseClient.ts` com mocks (a interface real com o SDK é coberta por e2e)
  - Não configurar component testing (vitest-browser) nesta campanha
- **Itens registrados em `docs/TECH-DEBT.md`:** 
  - ALTA: Kanban addComment sem verificação de permissão
  - ALTA: Kanban createCard/updateCard/moveCard sem verificação de escopo de projeto
  - MÉDIA: Coleção sprints com API Rules excessivamente permissivas

## Questões em aberto

1. A Fase 5 (hooks + service worker) é viável sem mocks especializados? Ou devemos pular para cobertura exclusivamente e2e?
2. Qual o coverage threshold mínimo aceitável? Sugiro 70% para domain/validation/client, 0% forçado para server (mantendo exclusão), 100% das rotas com e2e.
3. Devemos adicionar Playwright component testing (vitest-browser) para componentes complexos como RichTextEditor?

## Links

- Jira (após aprovação da spec): `docs/workflow/2026-07-22-testing-campaign.jira.md`
- Feature doc (pós-implementação): `docs/features/2026-07-22-testing-campaign.md`
- PR: `docs/workflow/2026-07-22-testing-campaign.pr.md`
