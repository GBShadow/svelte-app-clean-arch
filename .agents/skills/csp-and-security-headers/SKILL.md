---
name: "csp-and-security-headers"
description: "Definição de cabeçalhos de segurança HTTP estritos: CSP com nonces, HSTS, X-Frame-Options e Referrer-Policy."
id: "SKL-052"
title: "Skill: Content Security Policy (CSP) & HTTP Security Headers"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'seguranca', 'frontend', 'devops']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🛡️ CSP & HTTP Security Headers

## 🎯 Objetivo
Proteger a aplicação web contra injeção de scripts maliciosos, clickjacking e downgrade de protocolo via cabeçalhos HTTP.

---

## 🛠️ Headers Mandatórios
1. **Content-Security-Policy**: `default-src 'self'; script-src 'self' 'nonce-...'; object-src 'none'; frame-ancestors 'none';`
2. **HSTS**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
3. **Outros Headers**: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
