---
name: "auth-jwt-and-session-architect"
description: "Arquitetura de autenticação: tokens assimétricos RS256 com rotação JWKS, cookies httpOnly, refresh token theft detection e OAuth2."
id: "SKL-049"
title: "Skill: Autenticação Segura (JWT, JWKS, Sessões, OAuth2)"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'seguranca', 'backend', 'autenticacao', 'jwt']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🔐 Autenticação JWT & Session Architecture

## 🎯 Objetivo
Projetar e auditar fluxos de autenticação seguros e resilientes a roubo de sessão e vazamento de credenciais.

---

## 🛡️ Regras Mandatórias
1. **Armazenamento de Tokens**: Tokens de acesso e refresh devem residir em cookies `httpOnly`, `Secure` e `SameSite=Lax/Strict`.
2. **Assinatura Assimétrica**: Utilizar RS256/EdDSA com chave pública exposta em endpoint `/.well-known/jwks.json`.
3. **Detecção de Reuso de Refresh Token**: Invalidar toda a família de tokens se um refresh token antigo for apresentado.
