---
name: "sqlite-embedded-architect"
description: "Configuração de alta performance e concorrência em SQLite: modo WAL, PRAGMA synchronous, transações e lock handling."
id: "SKL-040"
title: "Skill: SQLite Embedded Architecture & WAL Mode"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'dados', 'sqlite', 'performance']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# ⚡ SQLite Embedded Architecture

## 🎯 Objetivo
Maximizar a vazão e confiabilidade de bancos SQLite embarcados em servidores e aplicações locais.

---

## 🛠️ Configurações Recomendadas
1. **Modo WAL**: Executar `PRAGMA journal_mode = WAL;` para permitir múltiplos leitores simultâneos durante escrita.
2. **Busy Timeout**: Configurar `PRAGMA busy_timeout = 5000;` para aguardar liberação de lock em vez de falhar imediatamente.
3. **Sincronização**: Usar `PRAGMA synchronous = NORMAL;` em modo WAL para ganho de I/O sem comprometer integridade.
