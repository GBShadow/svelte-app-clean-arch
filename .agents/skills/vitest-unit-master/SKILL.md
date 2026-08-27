---
name: "vitest-unit-master"
description: "Criação de testes unitários rápidos e determinísticos com Vitest, mocks de módulos (vi.mock), spies e cobertura de código."
id: "SKL-042"
title: "Skill: Vitest Unit Testing & Mocking Specialist"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'testes', 'vitest', 'typescript', 'frontend']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# ⚡ Vitest Unit Testing

## 🎯 Objetivo
Escrever testes unitários ultrarrápidos, isolados e com mocks precisos para código TypeScript/JavaScript.

---

## 🛠️ Padrões de Teste
1. **Isolamento Total**: Nunca compartilhar estado mutável entre blocos `it()` / `test()`; redefinir mocks em `beforeEach()`.
2. **Mocking Explícito**: Usar `vi.fn()` e `vi.mock()` apenas nas fronteiras de I/O (APIs, banco, filesystem).
3. **Asserções Semânticas**: Preferir `toStrictEqual()` para objetos e `toThrowErrorMatching...` para exceções esperadas.
