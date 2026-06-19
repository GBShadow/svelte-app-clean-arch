# <Nome da Feature>

## Resumo

Breve descrição do que foi implementado e por quê.

## App(s) afetado(s)

classic | remote | runes

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Domínio | packages/todo-domain/... |
| Gateway | packages/todo-domain/src/gateways/... |
| Server | apps/classic/src/lib/server/... |
| API | apps/classic/src/routes/api/... |
| UI | apps/classic/src/lib/components/... |

## Fluxo (Ports & Adapters)

Descrever caminho: UI → Container → Gateway → API → Store → Domínio.

## API (se houver)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/... | ... |

## Como testar

```bash
pnpm test --filter=classic
pnpm dev:classic
```

Cenários manuais e testes automatizados (incluir `TodoMemoryGateway`).

## Decisões de design

Trade-offs e motivos das escolhas arquiteturais.
