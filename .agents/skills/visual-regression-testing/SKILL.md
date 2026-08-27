---
name: "visual-regression-testing"
description: "Detecção de regressões visuais e quebras de layout usando snapshots de screenshot com Playwright e Storybook."
id: "SKL-044"
title: "Skill: Visual Regression Testing Specialist"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'testes', 'frontend', 'playwright', 'ux']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 📸 Visual Regression Testing

## 🎯 Objetivo
Prevenir alterações visuais acidentais em componentes e páginas através de comparação pixel-a-pixel de capturas de tela.

---

## 🛠️ Práticas Mandatórias
1. **Ambiente Determinístico**: Desabilitar animações CSS (`prefers-reduced-motion: reduce`) e congelar datas/relógios.
2. **Mascaramento de Dinâmicos**: Ocultar ou mascarar avatares aleatórios, timestamps e banners dinâmicos no snapshot.
3. **Limiar de Tolerância**: Configurar `maxDiffPixelRatio` aceitável para mitigar diferenças sutis de anti-aliasing entre sistemas operacionais.
