---
name: "database-seed-generator"
description: "Geração de massas de dados de teste realistas e relacionais, anonimização e factories determinísticas."
id: "SKL-041"
title: "Skill: Database Seeding & Synthetic Data Factory"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'dados', 'testes', 'typescript']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🌱 Database Seeding & Data Factories

## 🎯 Objetivo
Criar conjuntos de dados consistentes e realistas para testes automatizados e ambientes de desenvolvimento local.

---

## 🛠️ Padrões de Seed
1. **Fábricas com Defaults Realistas**: Usar geradores determinísticos (ex: Faker com seed fixo em testes).
2. **Ordem de Inserção Topológica**: Inserir registros respeitando dependências de chaves estrangeiras.
3. **Limpeza Idempotente**: Scripts de seed devem permitir re-execução sem duplicar registros únicos (`upsert`).
