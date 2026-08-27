---
name: "gdpr-privacy-compliance"
description: "Implementação de padrões de privacidade: direito ao esquecimento (soft vs hard delete), mascaramento de PII e consentimento."
id: "SKL-056"
title: "Skill: Privacidade de Dados e Conformidade LGPD/GDPR"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'seguranca', 'processo', 'dados']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 🔒 Privacy & LGPD/GDPR Compliance

## 🎯 Objetivo
Garantir o tratamento ético e legal de dados pessoais identificáveis (PII) em conformidade com as legislações de privacidade.

---

## 🛠️ Diretrizes
1. **Mascaramento em Logs**: Nunca emitir CPF, e-mail, senhas ou dados de cartão de crédito em logs de aplicação.
2. **Direito ao Esquecimento**: Implementar rotinas de anonimização de registros históricos quando um usuário solicitar exclusão.
3. **Consentimento Explícito**: Armazenar timestamp e versão dos termos de consentimento aceitos pelo usuário.
