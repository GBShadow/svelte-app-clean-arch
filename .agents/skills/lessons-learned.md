# Registrar problemas resolvidos

## Descrição

Regra de meta-processo: todo problema não trivial resolvido (bug encontrado em revisão,
vulnerabilidade, suposição do plano/spec que se mostrou errada durante a implementação,
comportamento inesperado de uma dependência) deve ser registrado, não só corrigido — para que o
mesmo erro não se repita em outra feature ou sessão.

## Quando usar

Sempre que um problema não trivial for corrigido durante o trabalho neste repositório. Critério:
se alguém lendo só o commit/diff, sem o contexto da conversa, ficaria sem entender por que aquilo
era um problema ou como reconhecer o mesmo padrão em outro lugar, registre. Ajustes triviais
(typo, formatação, lint) não precisam.

## Onde registrar, conforme o alcance

1. **Padrão generalizável** → nova regra/atualização em `.cursor/rules/<pasta>/<nome>.mdc` +
   `.agents/skills/<nome>.md` equivalente + entrada em `CLAUDE.md`. Ver
   `.cursor/rules/meta/rules-sync.mdc`. Exemplo: `pocketbase-api-rules.md`.
2. **Específico de uma feature** → seção "Decisões de design" do `docs/features/<slug>.md`. Ver
   exemplos em `docs/features/chat-realtime.md`.
3. **Comportamento da IA em sessões futuras** → memória persistente (`type: feedback` ou
   `type: project`), com o *porquê* e o *como aplicar*.

Um mesmo incidente pode exigir mais de um desses três.

## Ver também

- `.cursor/rules/meta/lessons-learned.mdc` — regra Cursor equivalente
- `.cursor/rules/meta/rules-sync.mdc` — sincronizar Cursor ↔ Freebuff ↔ Claude
- `.agents/skills/pocketbase-api-rules.md` — exemplo de skill nascida de um incidente
- `docs/features/chat-realtime.md` — exemplo de "Decisões de design" com relato de incidentes
