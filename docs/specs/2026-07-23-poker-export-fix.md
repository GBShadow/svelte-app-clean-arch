# Correção do Export de Tasks do Planning Poker

Created: 2026-07-23

## Contexto

Ao tentar exportar tasks pontuadas do Planning Poker para o Kanban,
o sistema não cria os cards e não exibe nenhum feedback — o usuário
clicou em "Exportar Selecionadas", nada aconteceu, e as tasks não
aparecem na coluna "Aguardando" do Kanban. Além disso, o painel de
export aparece mesmo quando a sala não está finalizada, o que leva a
erros silenciosos.

## Objetivo

Tasks pontuadas podem ser exportadas para o Kanban após finalizar a
sala, com validação de dados, feedback visual de sucesso/erro e
painel de export condicional à sala finalizada.

## Escopo

**Incluído:**
- Schema Zod `exportToKanbanSchema` (taskIds não vazio, strings válidas)
- Corrigir condição de skip no export (substituir continue por fail(400)
  com mensagem clara)
- Feedback visual: toast de sucesso ao exportar + toast de erro se falhar
- Corrigir UI: painel de export só aparece com roomStatus === 'finalized'
- Recarregar lista de tasks após export
- Adicionar testes do schema

**Fora do escopo:**
- Mudanças no fluxo de votação/pontuação
- Mudanças no Kanban (colunas, visualização)
- Testes E2E

## Requisitos funcionais

- RF1: Validar taskIds com exportToKanbanSchema antes de processar
- RF2: Retornar erro 400 se alguma task não tiver final_points
- RF3: Painel "Exportar" só aparece quando roomStatus === 'finalized'
- RF4: Toast de sucesso ao exportar
- RF5: Toast de erro se o export falhar
- RF6: Lista de tasks atualizada após export (via invalidação)
- RF7: exportToKanbanSchema em pokerSchemas.ts com testes

## Requisitos não funcionais

- Segurança: schema valida taskIds
- UX: feedback via toast
- Testabilidade: schema testável sem mocks

## Critérios de aceite

- [ ] AC1: Admin com sala finalizada + tasks pontuadas → Exportar cria
      cards no Kanban + toast de sucesso
- [ ] AC2: Botão desabilitado se nenhuma task selecionada
- [ ] AC3: Painel invisível se sala não finalizada
- [ ] AC4: Task sem final_points → erro 400 informando quais
- [ ] AC5: Task já exportada → erro 400 informando
- [ ] AC6: Após export, tasks aparecem com status "No Kanban"
- [ ] AC7: Falha no export → toast de erro
- [ ] pnpm test e pnpm check passam
- [ ] exportToKanbanSchema com testes

## Design

| Camada | Mudança |
|--------|---------|
| Validação | pokerSchemas.ts: exportToKanbanSchema |
| API | +page.server.ts: validar schema, fail(400) em vez de continue |
| UI | TaskList.svelte: painel condicional a finalized |
| UI | +page.svelte: handleExport trata response com toast |

## Contrato de API

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| POST | ?/exportToKanban | taskIds[] | { success, exported, skipped[] } ou fail |

## Questões em aberto

Nenhuma.
