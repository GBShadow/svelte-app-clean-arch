---
name: "conventional-commits-enforcer"
description: "Padronização de mensagens de commit (feat, fix, refactor, docs, chore), escopos e versionamento SemVer."
id: "SKL-068"
title: "Skill: Conventional Commits & Git Hygiene"
date: "2026-08-27"
last_updated: "2026-08-27"
tags: ['skill', 'processo', 'documentacao']
category: "skills"
scope: "global"
project: null
status: "vigente"
evidence: "inferido"
verified_at: "2026-08-27"
score: 10
archived: false
---

# 📝 Conventional Commits & Git Hygiene

## 🎯 Objetivo
Garantir histórico de commits legível, semântico e preparado para geração automática de CHANGELOG e versionamento SemVer.

---

## 🛠️ Estrutura do Commit
`<tipo>(<escopo>): <descrição curta no imperativo>`

- **Tipos Permitidos**: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`, `build`.
- **Exemplo**: `feat(auth): implementar suporte a rotacao automatica de jwks`
- **Breaking Changes**: Incluir `BREAKING CHANGE:` no rodapé ou `!` após o tipo (`feat(api)!: alterar schema de retorno`).
