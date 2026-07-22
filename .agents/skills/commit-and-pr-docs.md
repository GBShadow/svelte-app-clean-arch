# Atualização de Documentação em Commits e PRs

## Descrição

Sempre que commits ou PRs são criados, toda a documentação relevante deve ser atualizada para refletir o novo estado do projeto.

## Quando usar

- Ao criar commits (antes de commitar ou ao final do ciclo)
- Ao criar um PR (antes de abrir ou imediatamente após)

## Documentos a verificar

### Estrutura e rotas
- `docs/CODE-STRUCTURE.md` — novos arquivos/pastas, novo diretório, mudança de estrutura
- `docs/ROUTES.md` — novas rotas, alteração de rota existente, mudança de proteção

### Histórico
- `docs/CHANGELOG.md` — nova funcionalidade concluída (entrada no topo com data)

### Funcionalidades
- `docs/features/` — feature doc se for funcionalidade nova
- `docs/features/README.md` — índice, se feature doc foi adicionada

### Lições aprendidas
- `docs/LESSONS-LEARNED.md` — problema não trivial resolvido (causa raiz, solução)

### Débito técnico
- `docs/TECH-DEBT.md` — débito identificado e não corrigido na hora

### Configuração do projeto
- `AGENTS.md` — skills disponíveis (se nova skill foi adicionada)
- `README.md` (raiz) — visão geral, apps, comandos
- `docs/README.md` — índice da documentação

### PR e Workflow
- `docs/pr/` — resumo do PR para referência futura
- `docs/workflow/README.md` — se workflow foi alterado

## Passos

1. **Antes de commitar**: identifique quais docs foram afetados pelas mudanças
2. **Atualize cada doc**: siga o formato existente (tabelas, listas, blocos de código)
3. **Commite as mudanças de doc** junto ou antes do código
4. **PR**: inclua no body do PR referências aos docs atualizados
5. **Verifique**: confirme que `docs/README.md` lista todo doc novo

## Formato

Mantenha consistência com os documentos existentes:
- `|` tabelas para índices
- `-` listas para mudanças
- `` ``` `` blocos de código para exemplos
- `###` seções hierárquicas
- Datas no formato ISO (`YYYY-MM-DD`)
- Português conforme `language-convention` skill
- Sem trailer de co-autoria de IA
