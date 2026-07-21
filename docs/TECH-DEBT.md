# Débitos Técnicos — svelte-app-clean-arch

> **Documento vivo.** Diferente do [CHANGELOG.md](./CHANGELOG.md) (histórico imutável de features
> entregues), este arquivo é editado continuamente: itens entram quando um débito é identificado,
> são atualizados conforme o entendimento evolui, e migram para "Resolvidos" quando corrigidos —
> nunca são apagados. Ver regra completa em
> `.cursor/rules/meta/tech-debt.mdc` / `.agents/skills/tech-debt.md`.

## Quando adicionar um item aqui

Sempre que, durante uma spec, code review, implementação ou investigação, você identificar um
problema real (bug latente, simplificação arriscada, gap de segurança, inconsistência entre specs
e código, dependência desatualizada, teste faltando) que **não será corrigido agora** — só
descrito/adiado. Se o problema já foi corrigido na mesma sessão, ele não é débito técnico: siga
`.cursor/rules/meta/lessons-learned.mdc` em vez disso (registrar o que já foi resolvido).

Não registre ajustes triviais (typo, formatação) nem itens que já têm dono e prazo claros em uma
spec/Jira aberta (esses já estão rastreados lá).

## Como registrar um item

Adicione uma entrada em "Abertos" com este formato:

```md
### <título curto do débito>

- **Identificado em:** AAAA-MM-DD, durante <spec/review/PR/investigação — link se houver>
- **Local:** <arquivos, rotas, coleções PocketBase afetadas>
- **Descrição:** <o que está errado ou frágil, e por quê>
- **Impacto:** <o que quebra ou piora se isso não for corrigido — severidade>
- **Sugestão de resolução:** <abordagem recomendada, se já houver uma>
```

Antes de adicionar, procure um item relacionado já existente e **atualize-o** em vez de duplicar.

Ao corrigir um item: mova a entrada inteira para "Resolvidos", acrescentando `**Resolvido em:**
AAAA-MM-DD, PR/commit <link ou hash>` no final. Não delete o histórico do item.

## Abertos

### E2E Playwright falha ao resolver `$env` em imports do server

- **Identificado em:** 2026-07-15, durante investigação de notificações do Kanban
- **Local:** `apps/runes/playwright.config.ts` + `apps/runes/e2e/*.spec.ts`; imports transitivos de `src/lib/server/pocketbaseAdmin.ts` (que usa `$env/static/private`)
- **Descrição:** Rodar `npx playwright test` (ou `pnpm exec playwright test`) quebra com `Error: Cannot find package '$env' imported from .../pocketbaseAdmin.ts`. O runner do Playwright carrega os specs como TS puro e não aplica o alias/resolução de módulos do SvelteKit/Vite para `$env`, `$lib`, etc. Não é erro de código de feature — é o setup do runner E2E que não está processando os aliases do SvelteKit.
- **Impacto:** Não é possível validar E2E localmente (ex.: `kanban.spec.ts`) neste ambiente; a verificação fica limitada a `svelte-check` + `vitest`. Risco de regressões de UI/realtime não capturadas em CI local.
- **Sugestão de resolução:** Configurar `tsconfig-paths`/`playwright` para usar o `vite-tsconfig-paths` ou apontar o `tsconfig` do SvelteKit no `playwright.config.ts` (`tsconfig: './tsconfig.json'` + `resolveConfig` do SvelteKit), ou mover a lógica de teste para não importar módulos server que dependam de `$env`. Priorizar validação manual via `pnpm dev:full` enquanto isso.

## Resolvidos

_Nenhum item resolvido ainda._
