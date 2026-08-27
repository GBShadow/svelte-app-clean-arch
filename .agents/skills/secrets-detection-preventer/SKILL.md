---
name: "secrets-detection-preventer"
description: "Varredura contínua de código para impedir commit de credenciais, chaves de API, certificados e tokens em repositórios."
id: "SKL-051"
title: "Skill: Detecção e Prevenção de Vazamento de Segredos"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'seguranca', 'devops', 'code-review']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🕵️ Secrets Detection & Prevention

## 🎯 Objetivo
Impedir o vazamento acidental de chaves de API, senhas de banco de dados e certificados privados em repositórios Git.

---

## 🛡️ Práticas
1. **Git Hooks & TruffleHog/Gitleaks**: Configurar pre-commit hooks para varrer commits locais antes do push.
2. **Auditoria de Bundles**: Garantir que variáveis `.env` privadas não sejam injetadas em builds de frontend.
3. **Rotação Imediata**: Se um segredo for commitado, rotacioná-lo imediatamente — deletar do Git não anula a exposição.
