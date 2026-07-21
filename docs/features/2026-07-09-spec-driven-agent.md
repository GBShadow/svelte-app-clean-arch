# Subagente spec-driven

Created: 2026-07-09


## Resumo

Subagente do Claude Code (`.claude/agents/spec-driven.md`) que conduz o fluxo spec-driven do projeto (spec → Jira → implementação → feature doc → PR) de forma conversacional, seguindo os templates existentes e parando após spec + Jira até a implementação ser confirmada pelo usuário.

## App(s) afetado(s)

Nenhum — é um agente de processo/documentação (`.claude/agents/`), não uma funcionalidade de domínio dos apps `classic`/`remote`/`runes`.

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Agente | `.claude/agents/spec-driven.md` |
| Docs (índices) | `CLAUDE.md`, `README.md`, `docs/README.md`, `docs/workflow/README.md` |

## Fluxo (Ports & Adapters)

Não aplicável — não há domínio, gateway, server, API ou UI envolvidos. O "fluxo" do agente é documental:

```
Pedido de feature não trivial
  → Passo 0: detecta bugfix trivial? pula spec
  → Passo 1: docs/specs/<slug>.md (perguntas via AskUserQuestion, uma por vez)
  → Passo 2: docs/workflow/<slug>.jira.md (referencia a spec, Jira Key = [JIRA-KEY])
  → Passo 3: PARA — aguarda confirmação de implementação concluída
  → Passo 4 (após confirmação): docs/features/<slug>.md + entrada em CHANGELOG.md
      + docs/workflow/<slug>.pr.md, sugere `gh pr create` (não executa)
```

## API (se houver)

Não aplicável.

## Como testar

Validação manual (não há `TodoMemoryGateway` aplicável, pois não é código de domínio):

1. Pedir uma feature de exemplo não trivial e confirmar que o agente pergunta uma informação por vez e gera `docs/specs/<slug>.md` correto.
2. Confirmar que `docs/workflow/<slug>.jira.md` é gerado em seguida, referenciando a spec, sem Jira Key inventada.
3. Confirmar que o agente para nesse ponto e não escreve código nem gera feature doc/PR.
4. Confirmar (mensagem do usuário) a implementação e verificar que o agente gera feature doc, entrada de CHANGELOG e PR draft, atualizando os índices.
5. Pedir um bugfix trivial e confirmar que a etapa de spec é pulada.

Este próprio ciclo (spec `spec-driven-agent` → Jira → implementação do agente → esta feature doc → PR) serviu como teste ponta a ponta do fluxo descrito na spec.

## Decisões de design

- O agente nunca escreve código de produto (`apps/*/src`, `packages/*/src`) e nunca executa `git commit`/`git push`/`gh pr create` — apenas prepara arquivos-rascunho e sugere comandos, conforme RF8 da spec.
- Pausa obrigatória entre Jira e feature doc/PR (RF5/RF6): evita gerar documentação de "concluído" para uma implementação que ainda não existe.
- Default de arquitetura `runes` (conforme `CLAUDE.md`), com suporte a `classic`/`remote` apenas quando pedido explicitamente.
- `tools` do agente restritos a `Read, Write, Edit, Grep, Glob, Bash, AskUserQuestion` — sem `Agent`/`ExitPlanMode`, já que o escopo é estritamente documental.
