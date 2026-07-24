# Criação dos Agentes opencode

## Contexto
Criação de 7 agentes opencode para o projeto: frontend, backend, spec-creator,
spec-reviewer, code-reviewer, test-writer, docs-writer.

## Acertos
- Separar agentes em **primários** (frontend, backend — alternância via Tab)
  e **subagentes** (os demais — invocados via `@nome`) para não poluir o TUI
- Usar arquivos markdown em `.opencode/agents/` (descoberta automática pelo opencode)
- Incluir permissões granulares de `bash` (allow para check/test, ask para o resto)
- Adicionar `skill: allow` para que os agentes carreguem skills relevantes sob demanda
- Fluxo spec-creator → review automático → Jira evita specs frágeis irem para implementação
- Pasta `docs/memory/` com README explicando formato e tags

## Erros / Lições
- Inicialmente coloquei `frontend` como subagente, mas o usuário pediu primary —
  primary é melhor para trabalho ativo contínuo
- Não incluí TDD nos agentes de código desde o início — o usuário pediu depois
- A pasta de memória não estava prevista inicialmente — adicionada por demanda do usuário

## Decisões
- Agents em `.opencode/agents/` (formato markdown) em vez de `opencode.jsonc` para
  maior legibilidade e facilidade de edição
- Cores distintas para cada agente (`#ff3e00` frontend, `#0057ff` backend, etc.)
- `edit: deny` nos revisores (spec-reviewer, code-reviewer) para garantir read-only
- Quest permission `allow` para `spec-creator` poder fazer perguntas ao usuário

## Tags
agent, opencode, config
