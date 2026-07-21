---
description: >
  Revisão completa de código com verificação técnica, documentação e aprendizado.
  Analisa commits não enviados, um commit específico, branch, ou PR.
  Executa lint/typecheck, testes, análise de impacto, atualiza docs e registra lições aprendidas.
agent: build
---

# Revisão Completa de Código

Você é um revisor e arquiteto de software. Execute as etapas abaixo em ordem.

## 1. Identificar o escopo da revisão

$ARGUMENTS

Se `$ARGUMENTS` estiver vazio, revise **mudanças não commitadas** (unstaged + staged).

Se `$ARGUMENTS` for um hash de commit (7+ chars hex), revise **aquele commit**.

Se `$ARGUMENTS` for um número de PR ou URL contendo "github.com" ou "pull", revise **aquele PR**.

Se `$ARGUMENTS` for um nome de branch, revise `$ARGUMENTS...HEAD`.

Use git diff, gh pr diff, gh pr view para obter o diff e contexto.

## 2. Revisão técnica

- Leia os arquivos completos do diff para contexto, não só as linhas alteradas
- Identifique bugs, regressões, falhas de segurança, problemas de race condition
- Verifique se a mudança segue os padrões do projeto (Ports & Adapters, runes, PocketBase API rules)
- Aponte problemas de estrutura (aninhamento excessivo, complexidade ciclomática)
- Sinalize se alguma alteração quebra compatibilidade com outras partes do sistema
- **Não aponte problemas de estilo** a menos que violem convenções documentadas do projeto

## 3. Verificação automatizada

- Execute `npm run check` (raiz do monorepo — cobre typecheck de todos os apps/pacotes)
- Se falhar, execute `npm run check:domain` como fallback parcial
- Execute `npm run test` (testes unitários)
- Se houver testes relacionados às áreas alteradas, destaque os resultados
- Se algum teste falhar ou o typecheck quebrar, reporte como blocker

## 4. Análise de impacto

- Identifique **quais outros módulos/rotas/APIs** podem ser afetados pela mudança
- Verifique se a mudança requer alterações em coleções PocketBase (migrations)
- Verifique se a mudança altera contratos de API (endpoints, schemas de request/response)
- Verifique se há dependências circulares ou acoplamento indevido introduzido

## 5. Documentação

Verifique se os seguintes documentos precisam de atualização:

- **`docs/CODE-STRUCTURE.md`** — se novos arquivos/pastas foram adicionados, movidos ou removidos
- **`docs/CHANGELOG.md`** — se a mudança é uma funcionalidade, correção relevante ou refatoração significativa
- **`docs/features/<slug>.md`** — se a mudança implementa uma nova funcionalidade documentada
- **`docs/TECH-DEBT.md`** — se foi identificado débito técnico não corrigido nesta revisão

Se um documento precisa de atualização, **faça a atualização agora** seguindo o formato existente.

### Lessons-learned

Se durante a revisão você encontrou e corrigiu um problema não trivial (bug, suposição errada,
comportamento inesperado de dependência), registre a lição aprendida:

1. **Padrão generalizável** → crie/atualize `.agents/skills/<nome>.md` com a regra + referência em `AGENTS.md`
2. **Específico de feature** → adicione em "Decisões de design" em `docs/features/<slug>.md`
3. **Comportamento para sessões futuras** → registre o porquê e como aplicar

Siga o formato detalhado em `.agents/skills/lessons-learned.md`.

## 6. Relatório final

Gere um resumo estruturado com:

```markdown
## Revisão: <escopo>

### Diagnóstico
- **Alterações analisadas:** <arquivos, linhas>
- **Problemas encontrados:** <lista ou "nenhum">
- **Severidade:** <crítico/alto/médio/baixo>

### Verificações
- **Typecheck:** ✅ | ❌ (<detalhes se falhou>)
- **Testes:** ✅ | ❌ | ⏭️ (<detalhes>)
- **Impacto:** <módulos/rotas afetados, ou "nenhum impacto colateral">

### Documentação
- **CODE-STRUCTURE.md:** ✅ atualizado | ⏭️ não necessário
- **CHANGELOG.md:** ✅ atualizado | ⏭️ não necessário
- **Tech-debt:** <itens registrados ou "nenhum">
- **Lessons-learned:** <lições registradas ou "nenhuma">

### Ações necessárias
- <pendências se houver>
```

Se encontrou problemas que precisam de correção antes do merge, liste-os claramente com
arquivo:linha e sugestão de correção.
