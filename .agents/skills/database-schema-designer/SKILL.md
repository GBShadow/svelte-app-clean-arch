---
name: "database-schema-designer"
description: "Modelagem relacional normalizada (3NF), integridade referencial, chaves compostas e estratégias de indexação."
id: "SKL-036"
title: "Skill: Design e Modelagem de Esquemas de Banco de Dados"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ["skill", "arquitetura", "dados"]
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🗄️ Database Schema Design

## 🎯 Objetivo
Modelar bancos de dados relacionais eficientes, garantindo integridade referencial, normalização adequada e índices otimizados.

---

## 🏗️ Diretrizes
1. **Integridade Referencial**: Chaves estrangeiras com ações explícitas (`ON DELETE RESTRICT` / `CASCADE` justificado).
2. **Índices Estratégicos**: Criar índices em colunas de filtro frequente, ordenação (`ORDER BY`) e chaves de junção (`JOIN`).
3. **Tipagem Apropriada**: Preferir tipos de tamanho fixo ou nativos adequados (ex: `TIMESTAMPTZ`, `UUID`, `BIGINT`).
