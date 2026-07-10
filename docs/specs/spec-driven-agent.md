# Subagente spec-driven

## Contexto

Hoje o fluxo spec-driven (spec → Jira → implementação → feature doc → PR), descrito em `.cursor/rules/workflow/spec-driven.mdc` e `docs/spec-driven-development.md`, depende do Claude Code seguir manualmente os passos e templates a cada nova funcionalidade. Não existe um agente dedicado que automatize a condução desse processo, o que aumenta o risco de pular etapas, esquecer de atualizar índices, ou preencher os documentos fora do padrão do projeto.

## Objetivo

Um subagente do Claude Code (`spec-driven`) que conduz a criação da spec e do Jira interativamente com o usuário e, depois, sob demanda, gera a feature doc e o PR — tudo seguindo os templates e convenções já existentes no projeto.

## Escopo

**Incluído:**
- Subagente definido em `.claude/agents/spec-driven.md`
- Condução conversacional do preenchimento de `docs/specs/<slug>.md` a partir de `_template.md`
- Geração de `docs/workflow/<slug>.jira.md` a partir de `_template-jira.md`, referenciando a spec
- Atualização dos índices `docs/specs/README.md` e `docs/workflow/README.md`
- Pausa após spec + Jira, aguardando confirmação de implementação concluída
- Geração de `docs/features/<slug>.md`, entrada em `docs/CHANGELOG.md` e `docs/workflow/<slug>.pr.md` após a implementação
- Default `runes` (conforme `CLAUDE.md`), com suporte a `classic`/`remote` quando pedido explicitamente
- Regra de pular a spec para bugfixes triviais

**Fora do escopo:**
- Implementação de código da feature em si (o agente nunca escreve código de produto)
- Integração real com Jira/GitHub — o agente só prepara arquivos-rascunho; comandos como `gh pr create` são sugeridos, não executados automaticamente
- Corrigir a inconsistência classic/runes em `docs/spec-driven-development.md` (linha 62) — fica para decisão separada do usuário

## Requisitos funcionais

- RF1: Ao ser acionado com um pedido de nova funcionalidade não trivial, o agente deve perguntar ao usuário (uma pergunta por vez, preferencialmente múltipla escolha) as informações necessárias para preencher `docs/specs/_template.md`.
- RF2: O agente deve escrever `docs/specs/<slug>.md` com o conteúdo coletado e atualizar o índice em `docs/specs/README.md`.
- RF3: Em seguida, sem pausa adicional, o agente deve gerar `docs/workflow/<slug>.jira.md` a partir de `_template-jira.md`, referenciando a spec no campo Links, mantendo `[JIRA-KEY]` como placeholder.
- RF4: O agente deve atualizar o índice em `docs/workflow/README.md`.
- RF5: Após gerar spec + Jira, o agente deve parar e informar que a implementação deve seguir a arquitetura Ports & Adapters (`runes` por padrão, ou a variante pedida), sem escrever código.
- RF6: Quando o usuário confirmar que a implementação foi concluída (mesmo `<slug>`), o agente deve gerar `docs/features/<slug>.md`, adicionar entrada no `docs/CHANGELOG.md`, atualizar os índices relevantes e gerar `docs/workflow/<slug>.pr.md`.
- RF7: O agente deve detectar bugfixes triviais (poucas linhas, sem impacto de design) e pular a etapa de spec, indo direto para o Jira — conforme a regra já existente.
- RF8: O agente nunca deve commitar, dar push ou executar `gh pr create` sozinho — apenas preparar os arquivos e sugerir os comandos.

## Requisitos não funcionais

- O agente deve seguir exatamente os templates existentes (`docs/specs/_template.md`, `docs/workflow/_template-jira.md`, `docs/workflow/_template-pr.md`, `docs/features/_template.md`) sem inventar seções novas.
- O agente deve usar kebab-case consistente para `<slug>` em todos os arquivos gerados.
- Testes: não aplicável (agente de processo, não código de produto) — validação manual, testando o fluxo ponta a ponta com uma feature de exemplo.

## Critérios de aceite

- [ ] AC1: Dado um pedido de nova funcionalidade não trivial, quando o usuário aciona o fluxo, então o agente pergunta as informações da spec uma de cada vez e gera `docs/specs/<slug>.md` preenchido corretamente.
- [ ] AC2: Dado que a spec foi criada, quando o agente prossegue, então `docs/workflow/<slug>.jira.md` é gerado referenciando a spec, sem Jira Key inventada.
- [ ] AC3: Dado que spec e Jira foram gerados, quando o agente termina essa etapa, então ele para e não gera feature doc/PR nem escreve código até o usuário confirmar a implementação.
- [ ] AC4: Dado que o usuário confirma a implementação concluída, quando o agente é retomado, então ele gera feature doc, entrada de CHANGELOG e PR draft, atualizando os índices.
- [ ] AC5: Dado um bugfix trivial, quando o agente é acionado, então ele pula a etapa de spec e vai direto para o Jira.
- [ ] AC6: Testes manuais cobrindo os cenários acima (não há `TodoMemoryGateway` aplicável aqui, pois não é código de domínio).

## Design (Ports & Adapters — padrão runes)

Não aplicável — este é um agente de processo/documentação, não uma funcionalidade do domínio Todo. Não há mudança em domínio, gateway, server, API ou UI dos apps.

## Contrato de API (se houver)

Não aplicável.

## Alternativas consideradas

- **Slash command simples**: descartado por não permitir a condução conversacional interativa (perguntas uma de cada vez) exigida pela regra "validar com o usuário antes de implementar".
- **Cobrir apenas a spec** (sem Jira/feature doc/PR): descartado — o fluxo completo evita fragmentar o processo entre múltiplas ferramentas.
- **Pausar entre cada etapa individual** (spec, depois Jira, depois feature, depois PR): descartado — spec e Jira são ambos documentos de planejamento de baixo risco, então são gerados em sequência; a pausa real fica reservada para antes de feature doc/PR, que dependem da implementação estar pronta.

## Questões em aberto

- A inconsistência entre `docs/spec-driven-development.md` (menciona "classic" como padrão na etapa de implementação) e `CLAUDE.md` (padrão "runes") deveria ser corrigida separadamente. O agente seguirá o `CLAUDE.md` como fonte de verdade.

## Links

- Jira (após aprovação da spec): `docs/workflow/spec-driven-agent.jira.md`
- Feature doc (pós-implementação): `docs/features/spec-driven-agent.md`
- PR: `docs/workflow/spec-driven-agent.pr.md`
