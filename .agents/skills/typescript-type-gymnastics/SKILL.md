---
name: "typescript-type-gymnastics"
description: "Tipos condicionais, inferência com infer, Mapped Types, Template Literal Types e segurança de tipos ponta a ponta."
id: "SKL-065"
title: "Skill: TypeScript Avançado & Tipagem Estrita"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'typescript', 'qualidade']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🥋 Advanced TypeScript & Type Gymnastics

## 🎯 Objetivo
Construir contratos de tipo estritos e inteligentes que capturam erros de contrato em tempo de compilação sem recorrer a `any`.

---

## 🛠️ Técnicas Avançadas
1. **Zero `any`**: Usar `unknown` com type guards (`typeof`, `instanceof`, Zod schemas) para validar tipos dinâmicos.
2. **Tipos Utilitários Condicionais**: Utilizar `infer` para extrair tipos de retorno, argumentos ou valores de promessas.
3. **Discriminated Unions**: Modelar estados com chaves discriminantes (`status: 'loading' | 'success' | 'error'`) para estreitamento de tipos perfeito.
