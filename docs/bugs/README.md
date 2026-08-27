# Bugs

Fluxo de correção de bug com veredito e registro na memória central.

## Quando usar o fluxo de bug (em vez de spec)

Use este fluxo quando o pedido é **reparar um defeito**:

- Funcionalidade que **regrediu** (comportamento que já existia e quebrou em produção).
- Erro, exceção ou falha com sintoma observável e reprodutível.
- Correção pontual cujo objetivo é restaurar o comportamento esperado, não criar comportamento novo.

Quando o pedido é **nova funcionalidade** (mesmo que pequena) ou **mudança de comportamento por design**, use o fluxo spec-driven (`spec-driven.mdc`), não este.

## Fluxo (uma fase = um artefato)

| Fase | Artefato | Agente | Gate de saída |
|------|----------|--------|---------------|
| 1. Assess (read-only) | `docs/bugs/<slug>.assessment.md` | `bug-assess` | causa raiz + lista fechada de arquivos no escopo |
| 2. Fix (TDD) | `docs/bugs/<slug>.fix.md` | `frontend` / `backend` | teste que falhava agora passa; desvios registrados |
| 3. Test (veredito) | `docs/bugs/<slug>.test.md` | `test-writer` | veredito `verificado \| parcial \| falhou` |

- `<slug>` é kebab-case com prefixo de data (`YYYY-MM-DD-<nome>`), **o mesmo** nas três fases.
- Fase 1 é **read-only**: o `.assessment.md` não altera código.
- Fase 2 fica **confinada** aos arquivos listados em `## Arquivos no escopo do fix`; ampliar exige a seção `## Desvios do Assessment`.
- Fase 3 emite o veredito e decide o registro na memória central.

## Veredito e destino na memória central

| Veredito | Condição | Destino | ID |
|----------|----------|---------|----|
| `verificado` | a reprodução do assessment foi de fato re-executada **e** o fix confirmou o sintoma resolvido | `erros/<area>/<slug>.md` | `ERR-<AREA>-<NNN>` |
| `parcial` | testes passam, mas a reprodução documentada **não foi de fato executada** (downgrade obrigatório), ou restam casos de borda descobertos | `debitos-tecnicos/NNNN-<slug>.md` | `DEB-TEC-<NNN>` |
| `falhou` | a reprodução ainda falha ou o fix não resolveu o sintoma | `debitos-tecnicos/NNNN-<slug>.md` | `DEB-TEC-<NNN>` |

- `<area>` ∈ {`frontend`, `backend`, `infra`}.
- `NNNN` é a numeração sequencial de 4 dígitos em `debitos-tecnicos/`.

## Templates

| Fase | Template |
|------|----------|
| Assess | [_template-assessment.md](./_template-assessment.md) |
| Fix | [_template-fix.md](./_template-fix.md) |
| Test | [_template-test.md](./_template-test.md) |
