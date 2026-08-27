---
name: "docker-compose-orchestrator"
description: "Orquestração de ambientes locais de desenvolvimento multi-container com healthchecks, networks isoladas e volumes nomeados."
id: "SKL-047"
title: "Skill: Docker Compose Local Environment Orchestrator"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'devops', 'docker']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🐙 Docker Compose Orchestrator

## 🎯 Objetivo
Padronizar a inicialização de bancos de dados, brokers de mensagens e serviços auxiliares para desenvolvimento local com um único comando.

---

## 🛠️ Padrões
1. **Healthchecks**: Declarar `healthcheck` em bancos de dados para que serviços dependentes usem `condition: service_healthy`.
2. **Persistência Segura**: Usar volumes nomeados (`postgres_data:/var/lib/postgresql/data`) para evitar perda de estado local.
3. **Redes Isoladas**: Isolar serviços internos em redes privadas não expostas ao host desnecessariamente.
