---
name: "error-handling-hierarchy"
description: "Hierarquia de exceções de domínio, conversão unificada em respostas RFC 7807 (Problem Details) e prevenção de catch silencioso."
id: "SKL-067"
title: "Skill: Padronização e Hierarquia de Tratamento de Erros"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'arquitetura', 'error-handling', 'clean-architecture']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🛑 Error Handling Hierarchy & Standardization

## 🎯 Objetivo
Padronizar o tratamento de erros em todo o sistema, impedindo falhas silenciosas e retornando respostas claras e estruturadas.

---

## 🛠️ Regras Fundamentais
1. **Proibido Catch Silencioso**: Nunca capturar uma exceção sem relançá-la, registrá-la ou tratá-la explicitamente.
2. **Erros de Domínio vs Infraestrutura**: Erros de validação e negócio devem ser classes tipadas (`EntityNotFoundError`, `DomainValidationException`).
3. **RFC 7807 (Problem Details)**: Retornar erros de API em formato padronizado com `type`, `title`, `status`, `detail` e `instance`.
