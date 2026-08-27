---
name: "sql-query-tuner"
description: "Análise de planos de execução (EXPLAIN ANALYZE), identificação de Sequential Scans, indexação GIN/B-Tree e reescrita de queries."
id: "SKL-039"
title: "Skill: SQL Query Tuning & EXPLAIN Analysis"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ["skill", "dados", "performance", "troubleshooting"]
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🔍 SQL Query Tuning

## 🎯 Objetivo
Identificar e resolver consultas lentas analisando planos de execução e otimizando o uso de índices e memória do banco.

---

## 🛠️ Procedimento de Tuning
1. **EXPLAIN ANALYZE**: Inspecionar custos (`cost`), linhas estimadas vs reais e presença de `Seq Scan` em tabelas grandes.
2. **Indexação Coberta**: Criar índices que incluam todas as colunas da cláusula `WHERE` e `SELECT` (Index Only Scan).
3. **Subqueries vs Joins**: Substituir subconsultas correlacionadas `IN (...)` por `JOIN` ou `EXISTS` quando o otimizador falhar.
