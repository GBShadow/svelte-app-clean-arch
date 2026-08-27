---
name: "node-event-loop-profiler"
description: "Diagnóstico de gargalos no Event Loop do Node.js, CPU profiling, operações bloqueantes síncronas e libuv worker pool."
id: "SKL-059"
title: "Skill: Node.js Event Loop Profiling & Performance"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'backend', 'performance', 'troubleshooting', 'javascript']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# ⏱️ Node.js Event Loop Profiling

## 🎯 Objetivo
Identificar e eliminar bloqueios no thread principal do Node.js garantindo alta concorrência e baixa latência.

---

## 🛠️ Diagnóstico
1. **Evitar APIs Síncronas**: Nunca usar `fs.readFileSync`, `crypto.pbkdf2Sync` ou parsing JSON gigante no request loop.
2. **CPU Profiling**: Coletar perfis com `--cpu-prof` e inspecionar flamegraphs para localizar funções com alto tempo cumulativo.
3. **Divisão de Trabalho**: Descarregar tarefas intensivas de CPU para `worker_threads` ou processos auxiliares dedicados.
