# Checkpoint de Sessão

## Descrição

Skill de meta-processo que salva o estado completo da sessão atual em um arquivo de checkpoint,
permitindo que o trabalho seja retomado exatamente de onde parou em uma nova sessão ou agente.

Use **sempre** ao final de uma sessão, antes de pausar, trocar de tarefa, ou quando instruído
explicitamente com "checkpoint" ou "salvar sessão".

## Formato do checkpoint

Arquivos salvos em `docs/sessions/YYYY-MM-DD-HHmm--<slug>.md`.

```markdown
# Checkpoint: <título descritivo>

## Metadata
- **Data:** YYYY-MM-DD HH:mm
- **Branch:** <branch atual>
- **Contexto:** <breve descrição do que estava sendo feito>

## O que foi feito
- <lista de tarefas concluídas>

## Em andamento
- <o que está parcialmente feito>

## Pendências / Bloqueios
- <o que falta fazer ou o que está travando>

## Arquivos alterados
- <lista dos arquivos modificados, criados ou excluídos>

## Decisões tomadas
- <decisões de design, arquitetura ou implementação>

## Descobertas técnicas
- <comportamentos inesperados, bugs corrigidos, aprendizados>

## Próximos passos
1. <ação 1>
2. <ação 2>

## Comandos úteis para retomada
- <comandos específicos que estavam sendo usados>

## Documentos relacionados
- <links para specs, features, issues relevantes>
```

## Quando criar

1. **Fim de sessão** — sempre antes de encerrar
2. **Troca de contexto** — ao pausar uma tarefa para iniciar outra
3. **Bloqueio externo** — quando algo depende de terceiros/aprovação
4. **Sob instrução** — quando o usuário disser "checkpoint", "salvar sessão", "continuar depois"
5. **Pré-commit** — antes de commits grandes ou experimentais (rollback point)

## Como usar para retomar

Ao iniciar uma nova sessão com um checkpoint existente:

1. Leia o checkpoint mais recente de `docs/sessions/`
2. Sincronize com o branch (`git pull`, `git status`, `git log`)
3. Retome pelo "Em andamento" e "Próximos passos"
4. Ao terminar de retomar, **atualize o checkpoint** movendo itens de "Em andamento" para "O que foi feito"

## Ver também

- `docs/TECH-DEBT.md` — débito técnico identificado e não corrigido
- `.agents/skills/lessons-learned.md` — registrar problemas não triviais resolvidos
- `docs/CHANGELOG.md` — histórico imutável de funcionalidades entregues
