---
description: Salva o estado da sessão em docs/sessions/ e sincroniza docs versionados (CHANGELOG, CODE-STRUCTURE, ROUTES, TECH-DEBT, LESSONS-LEARNED, features) via docs-writer antes de /clear ou commit.
agent: build
---

# /checkpoint — Sincronização Antes do /clear ou Commit

Persiste o estado da sessão em `docs/sessions/` e sincroniza a documentação versionada invocando o agente **`docs-writer`**, que opera sobre `.opencode/.session-changes.log` (alimentado pelo plugin) e `git diff`.

## Quando usar

- **Antes de limpar a sessão** — obrigatório se a sessão teve decisões, padrões novos, bugs resolvidos com contexto não-óbvio, ou feedback direto do usuário
- **Antes de commitar** mudanças que afetam estado documentado (feature concluída, débito resolvido, novo módulo)
- **Ao mudar drasticamente de contexto** (ex: passar de client para PocketBase)
- **Ao pausar** uma tarefa para retomar depois — grava o checkpoint de retomada

## Procedimento

### 1. Checkpoint de retomada (skill `checkpoint`)

Crie `docs/sessions/YYYY-MM-DD-HHmm--<slug>.md` seguindo o template da skill `checkpoint` (`docs/sessions/`):

- Metadata (data, branch, contexto)
- O que foi feito / Em andamento / Pendências e bloqueios
- Arquivos alterados, decisões tomadas, descobertas técnicas
- Próximos passos + comandos úteis para retomada

### 2. Resumo da sessão (você, antes de invocar o agente)

Em até 10 bullets, liste o que aconteceu de relevante — input para o `docs-writer`:

- Decisões arquiteturais tomadas
- Bugs encontrados e a causa-raiz
- Feedback do usuário (corretivo ou validador)
- Padrões confirmados ou descobertos
- Erros de julgamento corrigidos

Descarte: conteúdo de commit messages (já em git log), status momentâneos (build verde), detalhes que o código já expressa.

### 3. Invocar `docs-writer`

Despache o agente via Task tool com `subagent_type: "docs-writer"`.

No prompt do agente, inclua:
- O resumo dos 10 bullets acima
- Slug da feature (se aplicável)
- Indicação se a feature está mergeada ou em andamento

O agente vai:
- Ler `.opencode/.session-changes.log` + `git diff`
- Atualizar docs conforme mapeamento (abaixo)
- **Truncar** `.opencode/.session-changes.log`
- Apresentar relatório e mensagem de commit sugerida

### Mapeamento (docs-writer)

| Mudança | Doc |
|---|---|
| Novos arquivos/pastas, reestruturação | `docs/CODE-STRUCTURE.md` |
| Rotas novas/alteradas/proteção | `docs/ROUTES.md` |
| Funcionalidade concluída | `docs/CHANGELOG.md` (entrada no topo, data ISO) + `docs/features/<slug>.md` |
| Problema não trivial resolvido | `docs/LESSONS-LEARNED.md` (causa raiz + solução) |
| Débito identificado e NÃO corrigido | `docs/TECH-DEBT.md` (item novo; mover resolvidos para § Resolvidos) |
| Nova skill/regra | `AGENTS.md` (seção de skills) |
| Nova coleção/migration PocketBase | `docs/CODE-STRUCTURE.md` + skills `pocketbase-*` |

### 4. Revisar o relatório

Antes de commitar:
- Confirme que cada mudança reflete o que aconteceu
- Se o agente sugeriu débito que você não quer registrar, peça remoção
- Ajuste tipo/escopo da mensagem de commit conforme convenção do `AGENTS.md`

### 5. Commit

Você decide o commit. **Nunca** comite por iniciativa do agente. Sem `Co-Authored-By` nem footer "Generated with ...".

## Regras

- O `docs-writer` **não cria** docs fora do mapeamento — se algo demanda doc novo, ele reporta; você decide
- Edits cirúrgicos, preservando o resto dos arquivos
- Checkpoint `docs/sessions/` é para retomada humana; docs versionados são fonte de verdade para o repo
- Se a sessão foi trivial (só uma pergunta respondida), diga isso e **não invoque** o agente para criar arquivos vazios — apenas o checkpoint de retomada se necessário
