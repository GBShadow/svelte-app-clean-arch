# Test: <Título do bug>

- Slug: `YYYY-MM-DD-<nome>`
- Testador: `test-writer`
- Data: `YYYY-MM-DD`

## Veredito

`verificado | parcial | falhou`

> **Regra de downgrade (obrigatória):** *se a reprodução do assessment não foi de fato executada, o veredito é rebaixado para `parcial`, independentemente dos testes passarem.*

- `verificado`: a reprodução foi re-executada, confirmou o sintoma resolvido **e** os testes passam.
- `parcial`: testes passam, mas a reprodução documentada não foi de fato executada, ou restam casos de borda descobertos.
- `falhou`: a reprodução ainda falha ou o fix não resolveu o sintoma.

## Reprodução re-executada

- **Comando:** `...`
- **Saída observada:** <o que foi observado agora, em contraste com o sintoma original>

## Testes

| Tipo | Nome | O que cobre | Resultado |
|------|------|-------------|-----------|
| unitário | `<arquivo>.test.ts` | ... | ✅/❌ |
| E2E | `<e2e>.spec.ts` | ... | ✅/❌ |

## Cobertura dos casos de borda

- <cada caso de borda do assessment e se está coberto>

## Registro na memória

- **Se `verificado`:** criar `erros/<area>/<slug>.md` com `id: ERR-<AREA>-<NNN>`, `evidence: verificado` e `source_refs` (repo + path) obrigatórios.
- **Se `parcial` ou `falhou`:** criar `debitos-tecnicos/NNNN-<slug>.md` com `id: DEB-TEC-<NNN>`, `evidence: inferido` (o `parcial` mapeia para `evidence: inferido`) e `source_refs` obrigatórios.

Arquivo a criar: `...`
