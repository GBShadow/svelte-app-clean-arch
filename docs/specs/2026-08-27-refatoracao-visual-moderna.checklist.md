# Refatoração Visual Moderna da Aplicação — Checklist do revisor

Criado: 2026-08-27
Slug: 2026-08-27-refatoracao-visual-moderna
Spec: [docs/specs/2026-08-27-refatoracao-visual-moderna.md](./2026-08-27-refatoracao-visual-moderna.md)

> **Propósito (R6):** este checklist é do **revisor** (`spec-reviewer`). Seus itens interrogam a **redação do requisito**, não o software. Um item satisfeito significa "a spec está bem escrita neste ponto" — nunca "a implementação está pronta".

> **Semântica do marcador:** `[x]` = critério de qualidade da **redação** revisado e satisfeito. **Só o humano marca.** O agente nunca marca `[x]`.

> **Verbos proibidos:** "Verificar", "Testar", "Confirmar", "clicar", "funciona corretamente" — e variações que descrevem testar o software em vez de avaliar a redação.

## Completude

- [ ] CHK001: Todo requisito funcional (`RF-001` a `RF-007`) possui pelo menos um critério de aceite correspondente em formato Dado/Quando/Então?
- [ ] CHK002: O escopo declara explicitamente o que está incluído e o que fica expressamente **fora de escopo**?

## Clareza & mensurabilidade

- [ ] CHK003: Os tempos de transição e animação estão mensurados com teto numérico objetivo (≤ 200ms)?
- [ ] CHK004: Os critérios de acessibilidade de contraste estão referenciados com a métrica da norma (WCAG 2.1 AA - 4.5:1 / 3:1)?
- [ ] CHK005: A estabilidade de layout está quantificada com métrica mensurável (CLS < 0.1)?

## Consistência

- [ ] CHK006: A terminologia para componentes, estados e superfícies mantém consistência em todas as seções da spec?
- [ ] CHK007: A especificação respeita o princípio R1 (agnóstica de stack e implementação física no arquivo de spec)?

## Cobertura de cenários

- [ ] CHK008: O comportamento sob preferência de movimento reduzido (`prefers-reduced-motion`) está contemplado?
- [ ] CHK009: Os cenários de estado vazio (empty state), carregamento e telas compactas (375px) estão especificados?

## Rastreabilidade

- [ ] CHK010: Todas as User Stories (`US1` a `US4`) possuem prioridade justificada, cenários de aceite e teste independente?
- [ ] CHK011: Os critérios de aceite (`AC-001` a `AC-006`) referenciam explicitamente seus requisitos de origem (`RF-###`)?
