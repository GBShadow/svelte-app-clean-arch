---
name: "rbac-and-abac-enforcer"
description: "Controle de acesso granular baseado em papéis (RBAC) e atributos (ABAC) com validação de posse e escopo de tenant."
id: "SKL-050"
title: "Skill: Autorização Granular (RBAC & ABAC)"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'seguranca', 'backend', 'rbac', 'permissoes']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🛡️ Autorização RBAC & ABAC

## 🎯 Objetivo
Garantir que usuários autenticados só acessem e mutem recursos sobre os quais possuem permissão e escopo explícitos.

---

## 🛠️ Padrões
1. **Autenticado ≠ Autorizado**: Nunca assumir que um JWT válido concede acesso ao recurso específico sem verificar posse (`resource.userId === user.id`).
2. **Tenant Scoping**: Filtrar todas as consultas com o `tenant_id` ou `project_id` do usuário logado diretamente na cláusula `WHERE`.
3. **Hierarquia de Permissões**: Modelar permissões no formato `<recurso>:<acao>` (ex: `invoices:write`, `reports:read`).
