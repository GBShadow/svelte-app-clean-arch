# CRUD de Categorias e Busca Agregada — Checklist do revisor

Criado: 2026-08-27
Slug: 2026-08-27-crud-categorias
Spec: [docs/specs/2026-08-27-crud-categorias.md](./2026-08-27-crud-categorias.md)

> **Propósito (R6):** este checklist é do **revisor** (`spec-reviewer`). Seus itens interrogam a **redação do requisito**, não o software. Um item satisfeito significa "a spec está bem escrita neste ponto" — nunca "a implementação está pronta".

> **Semântica do marcador:** `[x]` = critério de qualidade da **redação** revisado e satisfeito. **Só o humano marca.** O agente nunca marca `[x]`.

> **Verbos proibidos:** "Verificar", "Testar", "Confirmar", "clicar", "funciona corretamente" — e variações que descrevem testar o software em vez de avaliar a redação.

## Completude

- [ ] CHK001: Todo requisito funcional (RF-001 a RF-013) tem pelo menos um critério de aceite correspondente?
- [ ] CHK002: A abrangência de módulos suportados (Todos, Kanban, Planning Poker, Docs de Especificação, Retrospectiva) está declarada em RFs e User Stories?
- [ ] CHK003: O escopo declara explicitamente o que fica **fora** (subcategorias, tags N:N, automações)?
- [ ] CHK004: O comportamento de desvinculação suave (nullify) na exclusão de categoria está especificado para todos os 5 módulos?

## Clareza & mensurabilidade

- [ ] CHK005: Os limites de caracteres (nome: 50, descrição: 250) e tempos de resposta (< 1s) estão quantificados de forma mensurável?
- [ ] CHK006: Cada critério de aceite (AC-001 a AC-010) está expresso no formato observável Dado/Quando/Então?

## Consistência & Não-vazamento de Stack

- [ ] CHK007: A especificação respeita a R1 (sem nomes de tabelas, banco, frameworks, bibliotecas ou arquivos técnicos)?
- [ ] CHK008: A terminologia é uniforme em toda a spec (nomes claros para cada artefato de trabalho)?

## Cobertura de cenários

- [ ] CHK009: Os cenários de estado vazio (categoria sem itens vinculados e sistema sem categorias) estão cobertos?
- [ ] CHK010: Os casos de borda de segurança (XSS, controle de acesso e entrada maliciosa) estão descritos de forma agnóstica?

## Rastreabilidade

- [ ] CHK011: Cada critério de aceite referencia explicitamente as RFs de que deriva?
- [ ] CHK012: Cada User Story (US1 a US7) possui justificativa de prioridade, teste independente e cenários de aceite?

> **Nota para quem implementa (gate):** leia este checklist antes de começar. Itens `[ ]` indicam risco de ambiguidade na spec — não são work de implementação. **Não** altere os marcadores nem este arquivo: correções de redação são feitas pelo `spec-reviewer` no artefato dono (a spec).
