---
name: "code-simplifier"
description: "Refatoração para legibilidade, eliminação de código morto, redução de aninhamento com Early Return e clareza."
id: "SKL-061"
title: "Skill: Refatoração & Simplificação de Código"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'qualidade', 'code-review', 'refatoracao']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🧹 Code Simplifier & Refactoring

## 🎯 Objetivo
Transformar código complexo e verboso em implementações simples, limpas e fáceis de manter sem alterar seu comportamento externo.

---

## 🛠️ Princípios de Simplificação
1. **Guard Clauses (Early Return)**: Retornar ou lançar erro o mais cedo possível para eliminar blocos `if/else` profundamente aninhados.
2. **Nomes Declarativos**: Nomes de variáveis e funções devem expressar a intenção do domínio, eliminando a necessidade de comentários óbvios.
3. **Eliminação de Código Morto**: Remover imports, variáveis não utilizadas, blocos comentados e funções órfãs.
