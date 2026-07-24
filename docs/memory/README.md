# Memória dos Agentes

Registro cumulativo de acertos e erros para consulta dos agentes em sessões futuras.

## Como usar

**Antes de começar uma tarefa**, leia os arquivos relevantes desta pasta para
evitar repetir erros passados e seguir padrões que já funcionaram.

**Após concluir uma tarefa**, registre:
- O que funcionou bem
- O que deu errado / poderia ter sido melhor
- Decisões importantes e por que foram tomadas

## Formato dos arquivos

Cada arquivo segue o padrão `YYYY-MM-DD--<slug>.md`:

```md
# <Título>

## Contexto
O que estava sendo feito?

## Acertos
- O que funcionou bem e deve ser repetido

## Erros / Lições
- O que deu errado, por que, e como evitar

## Decisões
- Decisões arquiteturais ou de design tomadas

## Tags
frontend, backend, pocketbase, migration, spec, test, docs
```

## Tags comuns

Use tags no final de cada entrada para facilitar a consulta:

- `frontend` — componentes, UI, svelte, tailwind
- `backend` — pocketbase, server, API, hooks
- `migration` — migrations do PocketBase
- `spec` — spec-driven, requisitos
- `test` — testes unitários, e2e
- `docs` — documentação
- `security` — IDOR, XSS, SSRF
- `infra` — docker, deploy, config
- `agent` — comportamento dos próprios agentes

## Arquivos

<!-- Índice será mantido automaticamente pelos agentes -->
