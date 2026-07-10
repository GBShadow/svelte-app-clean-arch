# Subagente spec-driven

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | Medium |
| Labels | claude-code, process, documentation, workflow |
| Story Points | 3 |
| Jira Key | [JIRA-KEY] |
| Epic | _(opcional)_ |

## Description

### Contexto

O fluxo spec-driven (spec → Jira → implementação → feature doc → PR), descrito em `.cursor/rules/workflow/spec-driven.mdc` e `docs/spec-driven-development.md`, depende do Claude Code seguir manualmente os passos e templates a cada nova funcionalidade. Não existe um agente dedicado que automatize a condução desse processo, o que aumenta o risco de pular etapas, esquecer de atualizar índices, ou preencher os documentos fora do padrão do projeto.

### Objetivo

Um subagente do Claude Code (`spec-driven`) que conduz a criação da spec e do Jira interativamente com o usuário e, depois, sob demanda, gera a feature doc e o PR — tudo seguindo os templates e convenções já existentes no projeto.

### Escopo

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

## Acceptance Criteria

- [ ] AC1: Dado um pedido de nova funcionalidade não trivial, quando o usuário aciona o fluxo, então o agente pergunta as informações da spec uma de cada vez e gera `docs/specs/<slug>.md` preenchido corretamente.
- [ ] AC2: Dado que a spec foi criada, quando o agente prossegue, então `docs/workflow/<slug>.jira.md` é gerado referenciando a spec, sem Jira Key inventada.
- [ ] AC3: Dado que spec e Jira foram gerados, quando o agente termina essa etapa, então ele para e não gera feature doc/PR nem escreve código até o usuário confirmar a implementação.
- [ ] AC4: Dado que o usuário confirma a implementação concluída, quando o agente é retomado, então ele gera feature doc, entrada de CHANGELOG e PR draft, atualizando os índices.
- [ ] AC5: Dado um bugfix trivial, quando o agente é acionado, então ele pula a etapa de spec e vai direto para o Jira.
- [ ] AC6: Testes manuais cobrindo os cenários acima (não há `TodoMemoryGateway` aplicável aqui, pois não é código de domínio).
- [ ] `pnpm test` e `pnpm check` sem erros (não aplicável — sem código de produto)
- [ ] Documentação em `docs/features/spec-driven-agent.md`

## Technical Notes (Ports & Adapters — runes)

Não aplicável — este é um agente de processo/documentação, não uma funcionalidade do domínio Todo. Não há mudança em domínio, gateway, server, API ou UI dos apps.

| Camada | Ação |
|--------|------|
| Agente | `.claude/agents/spec-driven.md` — frontmatter (`name`, `description`, `tools`) + instruções de condução do fluxo |
| Testes | Validação manual, testando o fluxo ponta a ponta com uma feature de exemplo |

## Links

- Spec: `docs/specs/spec-driven-agent.md`
- Feature doc: `docs/features/spec-driven-agent.md`
- PR (após implementação): `docs/workflow/spec-driven-agent.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

- [ ] Definir agente `.claude/agents/spec-driven.md`
- [ ] Validar fluxo spec → Jira ponta a ponta
- [ ] Validar pausa antes de feature doc/PR
- [ ] Validar regra de bugfix trivial
- [ ] Documentação + PR
