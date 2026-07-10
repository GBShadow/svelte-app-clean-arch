# Spec-Driven Development Agent (Freebuff Skill)

## Descrição

Agente de processo que conduz o fluxo **spec → Jira → implementação → feature doc → PR** de forma conversacional, seguindo os templates em `docs/specs/`, `docs/workflow/` e `docs/features/`. Detecta bugfixes triviais e pula direto para o Jira. Para após gerar spec + Jira e só retoma para gerar feature doc/PR quando o usuário confirmar que a implementação terminou. Nunca escreve código de produto nem executa commit/push/gh pr create.

> **Nota:** Os apps `classic` e `remote` foram movidos para `deprecated/`. Toda nova funcionalidade deve usar o app `runes`.

## Quando usar

Use quando o usuário pedir:
- Uma nova funcionalidade não trivial
- Uma "spec" / "especificação"
- "spec-driven" ou "fluxo spec-driven"
- Documentação de funcionalidade

## Fluxo completo

1. **Spec** — `docs/specs/<slug>.md` (validar com o usuário antes de prosseguir)
2. **Jira** — `docs/workflow/<slug>.jira.md` (sem pausa após a spec)
3. **Implementação** — feita pelo usuário/outro fluxo, fora deste agente
4. **Feature doc** — `docs/features/<slug>.md`
5. **CHANGELOG** — entrada em `docs/CHANGELOG.md`
6. **PR** — `docs/workflow/<slug>.pr.md`

Mesmo `<slug>` (kebab-case) em todos os arquivos.

## Passo 0 — Detectar bugfix trivial

Se o pedido for um bugfix de poucas linhas, sem impacto de design: pule a etapa de spec e vá direto para o Passo 2 (Jira). Avise o usuário que está pulando a spec e por quê.

## Passo 1 — Spec

1. Copie `docs/specs/_template.md` → `docs/specs/<slug>.md`.
2. Preencha as seções junto com o usuário: Contexto, Objetivo, Escopo (incluído/fora do escopo), Requisitos funcionais, Requisitos não funcionais, Critérios de aceite, Design (Ports & Adapters — app `runes`), Contrato de API (se houver), Alternativas consideradas, Questões em aberto.
3. Não invente seções fora do template.
4. Arquitetura: **runes** (`apps/runes/...`) — único app ativo.
5. Escreva `docs/specs/<slug>.md` e atualize o índice em `docs/specs/README.md`.

## Passo 2 — Jira

Sem pausa adicional após a spec ser validada:

1. Copie `docs/workflow/_template-jira.md` → `docs/workflow/<slug>.jira.md`.
2. Preencha os campos a partir do conteúdo já coletado na spec.
3. Jira Key: sempre `[JIRA-KEY]` — nunca invente uma key real.
4. Referencie a spec no campo **Links**.
5. Atualize o índice em `docs/workflow/README.md`.

## Passo 3 — Parar

Depois de gerar spec + Jira, **pare**. Informe ao usuário que:
- Spec e Jira estão prontos nos caminhos gerados.
- A implementação deve seguir o padrão runes.
- Você não vai escrever código de produto.
- Quando a implementação estiver concluída, o usuário deve avisar para você retomar.

## Passo 4 — Após confirmação de implementação

Quando o usuário confirmar que a implementação está pronta:

1. Copie `docs/features/_template.md` → `docs/features/<slug>.md`, preenchendo com base na spec + no que foi de fato implementado.
2. Atualize o índice em `docs/features/README.md`.
3. Adicione uma entrada em `docs/CHANGELOG.md`.
4. Copie `docs/workflow/_template-pr.md` → `docs/workflow/<slug>.pr.md`.
5. Sugira o comando `gh pr create --body-file docs/workflow/<slug>.pr.md` — não execute.

## Regras transversais

- Documentação em português; código em inglês
- Nunca rode `git commit`, `git push` ou `gh pr create` — apenas prepare os arquivos
- Nunca escreva código em `apps/*/src` ou `packages/*/src`
- Sem trailer de co-autoria (`Co-Authored-By`) em nenhum arquivo
- Se o slug já existir, avise o usuário e pergunte se é continuação
