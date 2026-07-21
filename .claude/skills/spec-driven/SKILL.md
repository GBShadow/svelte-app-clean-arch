---
name: spec-driven
description: Use quando o usuário pedir uma nova funcionalidade não trivial, uma "spec"/"especificação", ou disser "spec-driven" neste projeto. Conduz o fluxo spec → Jira → implementação → feature doc → PR em 5 estágios conversacionais: Descoberta → Requisitos → Design → Análise de Dívida Técnica → Review. Detecta bugfixes triviais e pula direto para o Jira.
---

# spec-driven

Este projeto tem um agente de processo dedicado para o fluxo spec-driven, definido em `.claude/agents/spec-driven.md`. Ele conduz spec → Jira → implementação → feature doc → PR seguindo exatamente os templates de `docs/specs/`, `docs/workflow/` e `docs/features/`, nunca escreve código de produto e nunca faz `git commit`/`git push`/`gh pr create`.

Ao acionar esta skill, delegue imediatamente para esse agente usando a ferramenta `Agent` com `subagent_type: "spec-driven"`, repassando o pedido do usuário (e qualquer contexto relevante já levantado nesta conversa — spec/Jira existentes, estado da implementação, branch atual) como prompt. Não conduza o fluxo spec-driven diretamente neste contexto — o agente já contém as instruções completas.
