---
name: "mocking-and-fixtures-factory"
description: "Criação de Test Data Builders, fixtures modulares e substitutos de teste (Stubs, Mocks, Fakes, Spies)."
id: "SKL-045"
title: "Skill: Mocking Patterns & Test Fixture Factories"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'testes', 'typescript', 'clean-architecture']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🏭 Mocking & Test Fixtures Factory

## 🎯 Objetivo
Evitar setups gigantescos e duplicados em testes criando construtores de entidades fluentes e previsíveis.

---

## 🛠️ Padrões
1. **Test Data Builder**: Criar funções utilitárias `buildUser({ role: 'admin' })` com overrides opcionais e valores padrão válidos.
2. **Fakes em Memória**: Preferir implementações `InMemoryRepository` a mocks estritos com dezenas de `when(...).thenReturn(...)`.
