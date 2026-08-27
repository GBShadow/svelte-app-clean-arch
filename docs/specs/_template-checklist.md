# <Nome da Feature> — Checklist do revisor

Criado: <YYYY-MM-DD>
Slug: <YYYY-MM-DD-<nome>>
Spec: [docs/specs/<slug>.md](./<slug>.md)

> **Propósito (R6):** este checklist é do **revisor** (`spec-reviewer`). Seus itens interrogam a **redação do requisito**, não o software. Um item satisfeito significa "a spec está bem escrita neste ponto" — nunca "a implementação está pronta".

> **Semântica do marcador:** `[x]` = critério de qualidade da **redação** revisado e satisfeito. **Só o humano marca.** O agente nunca marca `[x]`.

> **Verbos proibidos:** "Verificar", "Testar", "Confirmar", "clicar", "funciona corretamente" — e variações que descrevem testar o software em vez de avaliar a redação.

## Completude

- [ ] CHK001: Todo requisito funcional tem pelo menos um critério de aceite correspondente?
- [ ] CHK002: O escopo declara explicitamente o que fica **fora**, sem ambiguidade?

## Clareza & mensurabilidade

- [ ] CHK003: O termo vago "<rápido>" está quantificado (tempo, taxa ou contagem)?
- [ ] CHK004: Cada critério de aceite é observável e testável no formato Dado/Quando/Então?

## Consistência

- [ ] CHK005: A terminologia é a mesma em toda a spec (sem sinônimos para a mesma entidade)?

## Cobertura de cenários

- [ ] CHK006: Os critérios de aceite estão definidos para o cenário de permissão negada?
- [ ] CHK007: Casos de borda (concorrência, estado vazio, sessão expirada, input malicioso) estão cobertos?

## Rastreabilidade

- [ ] CHK008: Cada AC referencia a `RF-###` de que deriva?
- [ ] CHK009: Cada US tem cenários de aceite e teste independente?

> **Nota para quem implementa (gate):** leia este checklist antes de começar. Itens `[ ]` indicam risco de ambiguidade na spec — não são work de implementação. **Não** altere os marcadores nem este arquivo: correções de redação são feitas pelo `spec-reviewer` no artefato dono (a spec).
