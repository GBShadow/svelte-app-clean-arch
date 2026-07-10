# Uso e Atualização do CODE-STRUCTURE.md

## Descrição

Regra para: (1) **sempre ler** `docs/CODE-STRUCTURE.md` antes de iniciar qualquer tarefa para entender a estrutura do projeto; (2) **atualizar todos os documentos relevantes** ao concluir a tarefa.

## Quando usar

Sempre ativo — aplica-se a qualquer tarefa no projeto.

## Passos

### Antes de começar

1. Leia `docs/CODE-STRUCTURE.md` para entender:
   - Estrutura de diretórios e arquivos
   - Onde as mudanças devem ser feitas (rota, servidor, domínio, componente)
   - Convenções existentes

### Ao finalizar a tarefa

Verifique e atualize os documentos aplicáveis:

#### 1. Estrutura do Código
- `docs/CODE-STRUCTURE.md` — se arquivos/pastas foram adicionados, removidos ou movidos

#### 2. Guias Principais
- `CLAUDE.md` — se regras, estrutura, comandos ou skills mudaram
- `README.md` (raiz) — se a visão geral, apps, ou comandos mudaram
- `docs/README.md` — se o índice da documentação mudou

#### 3. Histórico
- `docs/CHANGELOG.md` — se uma nova funcionalidade foi concluída

#### 4. Documentação de Funcionalidades
- `docs/features/<slug>.md` — se uma feature foi implementada
- `docs/features/README.md` — atualizar índice

#### 5. Specs (pré-implementação)
- `docs/specs/<slug>.md` — se uma spec foi criada
- `docs/specs/README.md` — atualizar índice

#### 6. Workflow (PR e Jira)
- `docs/workflow/<slug>.pr.md` — se um PR foi preparado
- `docs/workflow/<slug>.jira.md` — se um Jira foi criado
- `docs/workflow/README.md` — atualizar índice

#### 7. Sincronização entre Plataformas
- Toda regra nova em `.cursor/rules/` deve ter skill equivalente em `.agents/skills/`
- Toda regra/skill nova deve ser listada em `CLAUDE.md`

## Formato

Mantenha o formato consistente com os documentos existentes: tabelas `|`, listas `-`, blocos de código `` ``` ``, seções `###`.
