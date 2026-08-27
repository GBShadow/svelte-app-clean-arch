---
name: spec-driven
description: Use quando o usuário pedir uma nova funcionalidade não trivial, uma "spec"/"especificação", ou disser "spec-driven" neste projeto. Delegue para o agente spec-driven, que conduz o fluxo spec-driven de 7 fases (constituição → spec → esclarecimento → checklist → plan → tasks → implementação → convergência → documentação) seguindo os templates de docs/specs e o manual docs/spec-driven-development.md. Bugfix vai para docs/bugs/ (R9). Nunca escreve código de produto nem executa commit/push/gh pr create (R13).
---

# spec-driven

Este projeto tem um agente de processo dedicado para o fluxo spec-driven de **7 fases**, definido em `.claude/agents/spec-driven.md`. Ele conduz constituição → spec → esclarecimento → checklist → plan → tasks → implementação → convergência → documentação seguindo os templates de `docs/specs/` (`.md`, `.plan.md`, `.tasks.md`, `.checklist.md`, `<epico>.roadmap.md`) e o manual completo `docs/spec-driven-development.md`, nunca escreve código de produto e nunca faz `git commit`/`git push`/`gh pr create` (R13).

Bugfix **não** passa por este fluxo: vai para `docs/bugs/` (R9), não para o Jira direto.

Ao acionar esta skill, delegue imediatamente para esse agente usando a ferramenta `Agent` com `subagent_type: "spec-driven"`, repassando o pedido do usuário (e qualquer contexto relevante já levantado nesta conversa — spec/plan/tasks/checklist existentes, estado da implementação, branch atual) como prompt. Não conduza o fluxo spec-driven diretamente neste contexto — o agente já contém as instruções completas.
