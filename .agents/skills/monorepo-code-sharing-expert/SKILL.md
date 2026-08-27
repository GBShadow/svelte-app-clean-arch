---
name: "monorepo-code-sharing-expert"
description: "Organização de monorepos com pnpm workspaces e Turborepo: pacotes compartilhados, pipeline de build e isolamento de dependências."
id: "SKL-066"
title: "Skill: Arquitetura de Monorepos (Turborepo & pnpm)"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'devops', 'monorepo', 'pnpm', 'typescript']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 📦 Monorepo Architecture & Code Sharing

## 🎯 Objetivo
Estruturar repositórios múltiplos (aplicações + bibliotecas compartilhadas) com compilação paralela e cache distribuído.

---

## 🏗️ Estrutura Canônica
1. **`apps/*`**: Aplicações finais (Next.js, SvelteKit, APIs NestJS/FastAPI).
2. **`packages/*`**: Bibliotecas internas (`@shared/ui`, `@shared/types`, `@shared/config`).
3. **Turborepo Pipeline**: Configurar dependências topológicas em `turbo.json` (`"build": { "dependsOn": ["^build"] }`).
