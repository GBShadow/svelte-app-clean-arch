# Fix: <Título do bug>

- Slug: `YYYY-MM-DD-<nome>`
- Executor: `frontend` / `backend`
- Data: `YYYY-MM-DD`

## Assessment de origem

[`docs/bugs/<slug>.assessment.md`](./<slug>.assessment.md) — leia e respeite a lista fechada de arquivos.

## Teste que falhava antes

> **R12 — TDD é MUST:** nenhuma linha de produção sem o teste que a exige. Escreva primeiro o teste que reproduz o defeito (Red), veja-o falhar, só então corrija (Green) e refatore (Refactor).

- **Nome do teste:** `<arquivo>.test.ts`
- **Como falhava:** <comportamento observado antes do fix — o teste reproduzia o sintoma do assessment>

## Mudança aplicada

Arquivo por arquivo:

- `apps/runes/src/...` — <o que mudou e por quê>

## Desvios do Assessment

> Obrigatória **somente** quando o fix toca arquivo fora da lista fechada do assessment. Se não houve desvio, escreva: "Nenhum."

- **O que saiu do escopo:** `<arquivo>`
- **Por quê:** <motivo>
- **Evidência nova que justificou:** <arquivo:linha ou observação que obrigou a ampliar>

## Débito deixado

- <o que ficou pendente, links para `docs/TECH-DEBT.md` ou futura spec, se houver>
