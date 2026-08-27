---
name: "input-sanitization-validator"
description: "Sanitização de HTML com DOMPurify, validação de tipos em tempo de execução com Zod e mitigação de injeção de comandos."
id: "SKL-053"
title: "Skill: Sanitização de Entradas & Validação Estrita"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'seguranca', 'frontend', 'backend', 'zod']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🧼 Input Sanitization & Strict Validation

## 🎯 Objetivo
Impedir ataques de XSS, SQL Injection e injeção de comandos validando e sanitizando toda entrada vinda de usuários ou APIs.

---

## 🛠️ Diretrizes
1. **Validação na Borda**: Validar e converter tipos no início da requisição com Zod/Pydantic antes de qualquer processamento de negócio.
2. **Sanitização de HTML**: Sanitizar qualquer payload HTML renderizado com `DOMPurify.sanitize(input, { ALLOWED_TAGS: [...] })`.
3. **Rejeição em vez de Correção Mágica**: Rejeitar payloads malformados com erro 400 em vez de tentar adivinhar a intenção.
