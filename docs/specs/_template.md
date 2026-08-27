<!--
  INSTRUÇÕES AO AGENTE QUE PREENCHE — apague este bloco antes de entregar o rascunho.

  R1 — Spec sem stack. A spec descreve o QUÊ e o PORQUÊ: proibido nome de framework, biblioteca, arquivo, rota, coleção, campo de banco, componente. Tudo isso vive no `.plan.md`. Única exceção: nomear sistema externo já em produção quando o requisito é de compatibilidade.

  R2 — Ambiguidade com teto. Marque `[PRECISA ESCLARECER: pergunta]`, **máximo 3 por spec**. Se existe default óbvio da indústria ou do projeto, assuma o default e registre em `## Premissas` em vez de perguntar. Mais de 3 marcadores = a feature é grande demais → use `.roadmap.md`.

  R4 — IDs estáveis de largura fixa. `RF-001`, `RNF-001`, `AC-001`, `SC-001`, `CHK001`, `T001`, `US1` (user story), `R1` (entrada de roadmap). IDs nunca são renumerados nem reciclados após serem referenciados.
-->

# <Nome da Feature>

Criado: <YYYY-MM-DD>
Status: Rascunho
Slug: <YYYY-MM-DD-<nome>>
Supersede: docs/specs/<spec-substituída>.md

> `Status` assume um de: `Rascunho` | `Em validação` | `Aprovada` | `Superada`.
> `Supersede` fica presente **apenas** quando esta spec substitui outra (R10 — flow-forward); caso contrário, apague a linha.

## Contexto

Qual problema existe hoje? Por que essa funcionalidade é necessária? O que acontece hoje, e o que fica impossível ou caro sem ela?

## Objetivo

O que deve existir ao final, em 1–2 frases — sem detalhe de implementação.

## Escopo

**Incluído:**
- ...

**Fora do escopo:**
- ...

## User Stories priorizadas

Cada story é uma fatia de valor que pode ser entregue e validada sozinha. Ordene por prioridade (`P1` > `P2` > …). A implementação segue essa ordem.

### US1 — <título da story> (Prioridade: P1)

**Por que esta prioridade:** <por que esta story vem primeiro — maior valor, menor risco, desbloqueia as demais?>

**Teste independente:** <como validar esta story sozinha, entregando valor, sem depender das demais?>

**Cenários de aceite:**
1. Dado <estado inicial>, quando <ação>, então <resultado observável>.
2. Dado <estado inicial>, quando <ação>, então <resultado observável>.

<!-- Adicione `### US2 — … (Prioridade: P2)`, `### US3 — …`, etc., conforme necessário, em ordem decrescente de prioridade. -->

## Requisitos funcionais

> Um comportamento observável por linha. Use `MUST` para o inegociável e `DEVE` para o comportamento esperado.

- RF-001: DEVE <verbo> <objeto> <condição> — observável por <resultado observável>.
- RF-002: DEVE <verbo> <objeto> <condição>.
- RF-003: <...>

## Requisitos não funcionais

- RNF-001: <atributo não funcional — desempenho, acessibilidade, disponibilidade — com requisito mensurável>.
- RNF-TDD: Todo código de produção deve ser precedido pelo teste que o exige (Red-Green-Refactor). Nenhuma linha de produção é escrita sem um teste falhando primeiro (R12).
- RNF-SEG — segurança (ameaça → mitigação exigida, em linguagem agnóstica de stack):
  - **XSS — conteúdo fornecido pelo usuário executado como marca:** entrada livre ou texto rico é tratada como dado, nunca como marca executável; a renderização exige saneamento/escape explícito no ponto de exibição. A validação na entrada não é mitigação suficiente.
  - **IDOR / escalação de privilégio — acesso a recurso alheio por adivinhação de identificador:** toda leitura/escrita de um recurso verifica, no servidor, que o usuário autenticado tem vínculo com aquele recurso; o identificador enviado pelo cliente nunca é confiado sozinho.
  - **Vazamento por canal em tempo real:** toda entrega de evento/atualização passa pelo mesmo critério de autorização da leitura — o servidor filtra antes de enviar, e o cliente re-verifica — para que ninguém receba atualizações de dados a que não tem acesso.

## Casos de borda

- **Concorrência:** _o que acontece se dois usuários acionam a mesma ação simultaneamente?_
- **Dados inconsistentes:** _como o sistema reage quando o estado armazenado não reflete o esperado?_
- **Timeout / falha de rede:** _qual o comportamento quando uma requisição falha ou demora além do aceitável?_
- **Estado vazio:** _o que aparece quando não há dados a exibir?_
- **Permissão negada:** _qual o fluxo quando o usuário não tem acesso a um recurso?_
- **Input malicioso:** _como entrada forjada ou fora do contrato é rejeitada e reportada?_
- **Sessão expirada:** _o que acontece quando a sessão do usuário expira durante o uso?_
- **Dado obsoleto em tela:** _como garantir que o que está na tela reflete o estado atual, e não uma cópia antiga?_

## Critérios de aceite

> **AC descreve comportamento observável — nunca execução de comando, cobertura de teste ou "testes escritos antes".** Rodar `pnpm test` e escrever testes primeiro são tarefas da fase 5 (`.tasks.md`), não critério de aceite. Cada `AC-###` referencia a `RF-###` de que deriva.

- [ ] AC-001 (deriva de RF-001): Dado <estado inicial>, quando <ação>, então <resultado observável>.
- [ ] AC-002 (deriva de RF-002): Dado <estado inicial>, quando <ação>, então <resultado observável>.
- [ ] AC-003 (deriva de RF-00X): <...>

## Critérios de sucesso

> Métrica **mensurável e agnóstica de tecnologia** — tempo, taxa ou contagem observável pelo usuário.

- SC-001: <ação principal> em menos de <N> s (tempo medido do início da ação à confirmação).
- SC-002: <N>% de <evento> concluído sem erro (taxa observável).
- SC-003: <contagem mínima/esperada> de <coisa>.

## Premissas

> Defaults assumidos (R2) em vez de perguntar. Um por linha, com o porquê.

- <default assumido 1> — <por que é o default óbvio da indústria ou do projeto>.

## Esclarecimentos

<!-- Preenchida apenas na fase 1b (R3). Máximo 5 perguntas, uma por vez; o que sobrar da cota vira `Deferred:`. Formato:

### Sessão AAAA-MM-DD

- Q: <pergunta> → A: <resposta>

Deferred: <itens da cota não gastos>
-->

## Riscos e dívida técnica

- **Risco:** <risco> → <mitigação ou plano de contingência>.
- **Dívida técnica aceita:** <o que simplificamos agora e precisará ser refeito depois>.

## Questões em aberto

- <pergunta ou decisão ainda pendente — remover se não houver>.

## Links

- Plan: `docs/specs/<slug>.plan.md`
- Tasks: `docs/specs/<slug>.tasks.md`
- Checklist: `docs/specs/<slug>.checklist.md`
- Jira: `docs/workflow/<slug>.jira.md`
- Feature: `docs/features/<slug>.md`
- PR: `docs/workflow/<slug>.pr.md`
- Roadmap: `docs/specs/<epico>.roadmap.md` → entrada `R2` (quando esta spec é uma sub-feature de um épico)
- Supersede: `docs/specs/<spec-substituída>.md` (quando esta spec substitui outra — R10)
