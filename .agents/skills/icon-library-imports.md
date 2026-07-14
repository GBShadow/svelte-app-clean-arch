# Import de bibliotecas de ícones

## Descrição

Regra para importar ícones de bibliotecas (`lucide-svelte` e similares) por sub-path, nunca via
barrel (`import { X } from 'lucide-svelte'`). O barrel força o Vite a resolver/compilar o pacote
inteiro (centenas ou milhares de ícones), não só os nomes usados — tanto no SSR quanto no
`optimizeDeps` do client.

## Quando usar

Sempre que adicionar ou revisar um `import` de `lucide-svelte` (ou biblioteca de ícones
equivalente, ex.: `@tabler/icons-svelte`) em qualquer `.svelte`/`.ts` do app.

## Caso real (apps/runes)

Import barrel `import { Plus, X } from 'lucide-svelte'` causava:

- Log `Sourcemap for ".../dist/icons/<ícone>.svelte" points to a source file outside its package`
  repetido para ícones **nunca usados no app** (ex.: `zoom-out.svelte`) — sintoma de que o pacote
  inteiro estava sendo processado.
- Primeiro carregamento ~3x mais lento (medido via `server.ssrLoadModule` isolado: ~10-12s com
  barrel vs ~3-4s com sub-path).

O log em si só aparecia por causa de `resolve.preserveSymlinks: true` órfão em `vite.config.ts`
(resíduo de uma dependência de workspace já removida) — mas a lentidão do barrel import é uma
causa separada, que continua mesmo sem esse log.

## Passos

1. Importar cada ícone pelo sub-path: `import Plus from 'lucide-svelte/icons/plus';`. O nome do
   arquivo é o kebab-case do ícone (`BarChart3` → `bar-chart-3`, `LogOut` → `log-out`).
2. Para nomes legados/alias (`HelpCircle`, `CheckCircle`, `Edit`, `Edit2`), o sub-path continua
   funcionando — é um pequeno re-export para o ícone canônico, sem puxar o pacote inteiro. Conferir
   em `node_modules/lucide-svelte/dist/aliases/aliases.js` se o nome não é óbvio.
3. Ao remover uma dependência de workspace, revisar `vite.config.ts` em busca de opções
   (`resolve.preserveSymlinks`, `ssr.noExternal`, `optimizeDeps.include/exclude`) que só existiam
   por causa dela — config órfã pode mascarar sintomas de outros problemas depois.

## Ver também

- `.cursor/rules/architecture/icon-library-imports.mdc` — regra Cursor equivalente
