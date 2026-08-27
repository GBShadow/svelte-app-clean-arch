---
name: "dockerfile-optimizer"
description: "Construção de Dockerfiles multi-stage de tamanho mínimo, execução com usuário non-root e cache eficiente de camadas."
id: "SKL-046"
title: "Skill: Dockerfile Multi-Stage & Image Optimizer"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'devops', 'docker', 'seguranca']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🐳 Dockerfile Optimization & Security

## 🎯 Objetivo
Gerar imagens de container enxutas, seguras e com compilação rápida utilizando cache inteligente de camadas.

---

## 🛠️ Diretrizes
1. **Multi-Stage Builds**: Separar o estágio de build (Node/SDK completo) do estágio de runtime (Alpine/Distroless).
2. **Non-Root User**: Criar e utilizar usuário sem privilégios (`USER node` ou `USER appuser`) no estágio final.
3. **Ordem de Camadas**: Copiar manifestos de dependências (`package.json`, `pnpm-lock.yaml`) antes do código-fonte.
