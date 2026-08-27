# <Nome do Épico> — Roadmap

Criado: <YYYY-MM-DD>
Slug: <YYYY-MM-DD-<nome-epico>>

> **Quando recorrer a um roadmap (em vez de uma spec única):**
> - mais de 3 marcadores `[PRECISA ESCLARECER]` na spec (R2);
> - mais de ~3 user stories;
> - ou uma única fase grande demais para caber numa sessão de spec.
>
> Cada entrada `R1`, `R2`, … vira uma **spec própria** (`docs/specs/<slug>.md`), cada uma com seu plan, tasks e convergência. O roadmap mantém a visão do todo sem estourar os tetos de uma spec individual.

## Decomposição

| ID | Sub-feature | Intenção | Fronteira de escopo | Depende de | Status | Sub-spec |
|----|-------------|----------|---------------------|------------|--------|----------|
| R1 | <sub-feature 1> | <valor entregue> | <o que fica dentro/fora> | — | planejada | `docs/specs/<slug-1>.md` |
| R2 | <sub-feature 2> | <valor entregue> | <o que fica dentro/fora> | R1 | planejada | `docs/specs/<slug-2>.md` |

> **IDs imutáveis (R4):** `R1..Rn` nunca são renumerados nem reciclados depois de referenciados. Uma entrada removida deixa um buraco na sequência (o próximo continua `R{n+1}`).

> **Status:** `planejada` · `em-andamento` · `concluída`.

## Link bidirecional

- O roadmap referencia cada sub-spec na coluna `Sub-spec`.
- Cada sub-spec cita, no seu campo `## Links`:

  ```
  Roadmap: docs/specs/<epico>.roadmap.md → entrada R2
  ```

  Assim é possível navegar nos dois sentidos sem adivinhar o ID.
