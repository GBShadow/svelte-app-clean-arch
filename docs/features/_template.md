# <Nome da Feature>

Created: <YYYY-MM-DD>

## Resumo

Breve descrição do que foi implementado e por quê.

## App(s) afetado(s)

runes

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Domínio | `apps/runes/src/lib/domain/` ou `packages/todo-domain/` |
| Gateway | `packages/todo-domain/src/gateways/` |
| Server | `apps/runes/src/lib/server/` |
| API | `apps/runes/src/routes/` |
| UI | `apps/runes/src/lib/components/` |

## Fluxo (Ports & Adapters)

Descrever caminho: UI → Container (onMount + service.load) → Service (.svelte.ts) → Gateway (todo-domain) → API → Store.

## API (se houver)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/... | ... |

## Como testar

```bash
pnpm test
pnpm dev:runes
```

Cenários manuais e testes automatizados (incluir `TodoMemoryGateway`).

## Decisões de design

Trade-offs e motivos das escolhas arquiteturais.
