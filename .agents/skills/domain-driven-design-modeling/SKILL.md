---
name: "domain-driven-design-modeling"
description: "Modelagem de Entidades, Value Objects imutáveis, Agregados com raiz consistente e Eventos de Domínio."
id: "SKL-064"
title: "Skill: Modelagem Tática de Domain-Driven Design (DDD)"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'arquitetura', 'ddd', 'clean-architecture']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🎯 Domain-Driven Design (DDD) Modeling

## 🎯 Objetivo
Modelar o núcleo de negócio refletindo a Linguagem Ubíqua com regras protegidas dentro de Agregados e Value Objects.

---

## 🏗️ Blocos de Construção
1. **Value Objects**: Imutáveis, sem identidade própria, validados na criação (ex: `Money`, `Email`, `Address`).
2. **Entities & Aggregates**: Entidades com identidade única; a raiz do agregado controla as invariantes de negócio de todos os nós internos.
3. **Domain Events**: Disparar eventos quando ocorrem mudanças significativas no estado do domínio (`OrderPlacedEvent`).
