# Assessment: <Título do bug>

> **Read-only:** este documento registra diagnóstico e escopo. Ele **não altera código** — a correção acontece na fase fix, a partir de [_template-fix.md](./_template-fix.md).

- Slug: `YYYY-MM-DD-<nome>`
- Assessor: `bug-assess`
- Data: `YYYY-MM-DD`

## Sintoma

Cole aqui a **mensagem de erro literal**, sem parafrasear (stack trace, log, output do terminal ou do navegador):

```text
<mensagem literal do erro>
```

## Reprodução

Passos para reproduzir o defeito:

1. ...
2. ...
3. ...

**Executada: sim/não**

> _Este campo decide o downgrade na fase test: se a reprodução aqui documentada não foi de fato executada, o veredito final cai para `parcial`, mesmo com testes verdes._

## Memória consultada

Saída dos comandos de memória (R11 — memória primeiro):

```text
$ python3 ~/projects/agent-memory/scripts/memory.py symptom "<mensagem literal>"
<saída>
```

```text
$ python3 ~/projects/agent-memory/scripts/memory.py solve "<problema>"
<saída>
```

Conclusão: **já aconteceu antes / é novo** — _registrar qual e apontar o artefato de memória relevante, se houver._

## Evidência

Arquivo e linha **reais** onde o defeito se manifesta — nunca suposição:

- `apps/runes/src/...:NN` — <o que a linha faz>

## Causa raiz

O porquê do defeito, apontando a falha exata no fluxo (não o sintoma).

## Arquivos no escopo do fix

Lista **fechada** — o fix não pode tocar em arquivo fora desta lista sem registrar desvio em `## Desvios do Assessment`:

- `apps/runes/src/...`

## Remediação proposta

A abordagem sugerida para a correção (o agente de fix pode refinar, mas sem ampliar o escopo).

## Risco de regressão

O que pode quebrar com o fix e como mitigar.

## Fora do escopo

- O que **não** será corrigido nesta passada (explicar por quê).
