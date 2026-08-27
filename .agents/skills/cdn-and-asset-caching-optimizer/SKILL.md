---
name: "cdn-and-asset-caching-optimizer"
description: "Estratégias de cache HTTP: Cache-Control imutável para assets com hash, stale-while-revalidate e invalidação em CDN."
id: "SKL-060"
title: "Skill: Otimização de Cache HTTP, Assets e CDN"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'frontend', 'devops', 'performance']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🚀 CDN & HTTP Asset Caching

## 🎯 Objetivo
Maximizar a taxa de acertos de cache (Cache Hit Ratio) em CDNs e navegadores reduzindo a carga nos servidores de origem.

---

## 🛠️ Regras de Cache
1. **Assets com Hash**: `Cache-Control: public, max-age=31536000, immutable` para arquivos estáticos (`.js`, `.css`, imagens versionadas).
2. **HTML & Dados Dinâmicos**: `Cache-Control: public, max-age=0, must-revalidate` ou `s-maxage=60, stale-while-revalidate=300`.
3. **ETags & 304 Not Modified**: Garantir suporte a validação condicional via headers `If-None-Match` / `ETag`.
