# Registrar débito técnico em docs/TECH-DEBT.md

## Descrição

Regra de meta-processo: todo débito técnico identificado durante uma spec, code review,
implementação ou investigação — e deliberadamente **não corrigido na hora** — deve ser registrado
em `docs/TECH-DEBT.md`, um documento vivo mantido continuamente (nunca reescrito do zero, nunca
apagado — só atualizado/movido para "Resolvidos").

## Diferença de `lessons-learned`

- **`lessons-learned`** → problema não trivial **já corrigido** nesta sessão. Registra o porquê e
  como evitar de novo.
- **`tech-debt`** (esta skill) → problema identificado que **não foi corrigido agora**, adiado por
  escopo/prioridade/tempo. Registra para trabalho futuro.

## Quando usar

Sempre que identificar, sem corrigir na mesma sessão:

- Bug latente ou simplificação arriscada aceita por falta de tempo/escopo.
- Gap de segurança (IDOR, XSS, vazamento de dados) não bloqueante para a tarefa atual mas que
  precisa de acompanhamento.
- Inconsistência entre uma spec (`docs/specs/`) e o código implementado.
- Dependência desatualizada, teste faltando, duplicação que deveria virar abstração.
- Decisão consciente de "fazer o simples agora, revisitar depois".

Não registre ajustes triviais, nem itens que já têm dono/prazo em uma spec ou Jira aberta — não
duplique o rastreamento.

## Como registrar

Siga o formato descrito no próprio `docs/TECH-DEBT.md`: título curto, data + contexto de origem,
local no código, descrição, impacto, sugestão de resolução. Procure um item relacionado antes de
criar um novo. Ao resolver um item, mova-o para "Resolvidos" com data e PR/commit.

## Ao trabalhar em área com débito conhecido

Antes de mexer em arquivos/rotas/coleções já listados em `docs/TECH-DEBT.md`, avalie resolver o
item junto (se o escopo permitir) ou ao menos avise o usuário que o débito existe.

## Ver também

- `docs/TECH-DEBT.md` — o documento vivo em si
- `.cursor/rules/meta/tech-debt.mdc` — regra Cursor equivalente
- `.agents/skills/lessons-learned.md` — complementar: registrar o que já foi corrigido
- `.cursor/rules/meta/rules-sync.mdc` — sincronizar Cursor ↔ Freebuff ↔ Claude ↔ Antigravity
