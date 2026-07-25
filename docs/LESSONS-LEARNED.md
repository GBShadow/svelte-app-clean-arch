# Lições Aprendidas

> **Documento vivo.** Todo problema não trivial resolvido nesta base deve ser registrado aqui com
> a causa raiz, para que o mesmo erro não se repita em outra feature ou sessão.
>
> Ver skill `.agents/skills/lessons-learned.md` para critérios de inclusão.

---

## [2026-07-21] `fields.add()` no PocketBase requer `new RelationField()`, não plain object

**Contexto:** Migration `0021_create_projects_sprints.js` usava `fields.add({ name: '...', type: 'relation', ... })` com um plain object.

**Causa raiz:** No PocketBase, `fields.add(field)` espera uma **instância** de tipo de campo (ex.: `new RelationField({...})`). Plain objects são ignorados silenciosamente — a migration "passa" mas o campo não é criado.

**Sintoma:** `new` projetos não salvavam dados de responsáveis/participantes (relação não existia).

**Correção:** Substituir `fields.add({...})` por `fields.add(new RelationField({...}))` e rebuildar a imagem Docker.

**Prevenção:** Sempre usar `new <FieldType>({...})` em migrations PocketBase. Verificar com `curl`/API admin se o campo foi de fato criado.

---

## [2026-07-21] `throw redirect()` dentro de `try-catch` é engolido silenciosamente

**Contexto:** Em `projects/new/+page.server.ts`, o `redirect(303, '/projects')` estava dentro de um bloco `try`.

**Causa raiz:** SvelteKit usa `throw redirect()` como uma exceção especial. Se estiver dentro de `try-catch`, o `catch` engole o redirect — nenhum erro é mostrado, mas o redirect não acontece.

**Sintoma:** Após criar um projeto, o usuário não era redirecionado para `/projects` (ficava parado na tela de criação, quebrando).

**Correção:** Mover `throw redirect()` para fora do `try-catch`, ou relançar redirects no `catch`.

**Prevenção:** `throw redirect()` deve SEMPRE estar fora de blocos `try-catch`, a menos que haja um `catch` específico que relance redirects.

---

## [2026-07-21] Avatar placeholder sem centralização em divs inline

**Contexto:** Placeholders de avatar inline em `projects/[id]/+page.svelte` e `kanban/+page.svelte` não tinham `flex items-center justify-center`.

**Causa raiz:** O componente `Avatar.svelte` já tem essas classes, mas quando o avatar é renderizado inline (não via componente) com um `div` contendo a inicial, a centralização precisa ser adicionada manualmente.

**Sintoma:** Iniciais do avatar apareciam desalinhadas (no canto superior esquerdo).

**Correção:** Adicionar `flex items-center justify-center` a todas as divs de placeholder de avatar inline.

**Prevenção:** Sempre que criar um placeholder de avatar manualmente (sem usar o componente `Avatar.svelte`), incluir `flex items-center justify-center` na div.

---

## [2026-07-21] `md:grid-cols-13` não existe no Tailwind (máximo é 12)

**Contexto:** `CardDeck.svelte` usava `grid-cols-4 sm:grid-cols-7 md:grid-cols-13` para exibir 13 cartas do Planning Poker.

**Causa raiz:** Tailwind CSS só gera `grid-cols-1` até `grid-cols-12` por padrão (a menos que o tema seja estendido). `grid-cols-13` é ignorado, fazendo o grid cair para o layout padrão (uma coluna) em `md+`.

**Sintoma:** O baralho de cartas do Planning Poker exibia as cartas em uma única coluna em screens médios/grandes.

**Correção:** Remover `md:grid-cols-13` — usar `grid-cols-4 sm:grid-cols-7` que já cobre bem 13 cartas (2 linhas de 7 + 1).

**Prevenção:** Validar classes Tailwind contra a documentação. Verificar visualmente em diferentes breakpoints.

---

## [2026-07-21] `expand: 'user'` via `locals.pb` não resolve outros participantes

**Contexto:** No load do poker room (`poker/[roomId]/+page.server.ts`), os participantes eram buscados com `locals.pb` e `expand: 'user'`.

**Causa raiz:** A `viewRule` da coleção `user` é `@request.auth.isAdmin = true || email = @request.auth.email`. Um usuário não-admin só pode VER o próprio registro (`user`). O `expand` no PocketBase respeita a `viewRule` — expandir um `user` de outro participante falha silenciosamente, retornando `undefined`.

**Sintoma:** Participantes que não eram o usuário logado apareciam como "Votante" (fallback) em vez do nome real.

**Correção:** Usar `getAdminClient()` (cliente superusuário) para buscar participantes com `expand: 'user'`. O admin não é barrado pela `viewRule`.

**Prevenção:** Sempre que precisar fazer `expand` em uma coleção com `viewRule` restritiva, usar `getAdminClient()` em vez de `locals.pb`. Esse padrão já era usado em outras partes (kanban, chat) — o poker estava inconsistentemente usando `locals.pb`.

---

## [2026-07-21] Botão `absolute` sobrepõe conteúdo irmão quando não há cuidado com o fluxo

**Contexto:** O botão "Nova Task" no backlog do poker era posicionado com `absolute top-6 right-6` dentro de um `relative` wrapper do `TaskList`.

**Causa raiz:** Posicionamento absoluto tira o elemento do fluxo normal. Se o conteúdo irmão (filtros) estiver na mesma posição, o botão sobrepõe. A falha específica: `top-6 right-6` cai exatamente onde o `TaskList` renderiza seus filtros.

**Sintoma:** Botão "Nova Task" sobrepunha os filtros de status do backlog.

**Correção:** Mover o botão para dentro do `TaskList.svelte`, no header, como um elemento de fluxo irmão dos filtros (sem `absolute`). Adicionar prop `onCreateTask`.

**Prevenção:** Posicionamento `absolute` deve ser usado com cautela e verificado visualmente. Preferir layout de fluxo (flex/grid). Se for absolutamente necessário, garantir que a posição não coincide com conteúdo fluido.

---

## [2026-07-21] Redirecionamento de rota sem estado — usar cookie para KVP de última sessão

**Contexto:** A rota `/kanban` sem `?project=` redirecionava para `/projects` (dead end UX).

**Causa raiz:** A `load function` do kanban exige um `projectId` via query param. Sem ele, redirecionava para a listagem de projetos — não havia como persistir "qual foi o último kanban acessado".

**Solução:** Cookie `lastKanbanProject` (path: `/kanban`, 1 ano, httpOnly). Quando o usuário acessa um kanban de projeto, o ID é salvo. Quando acessa `/kanban` sem param, lê o cookie e redireciona. Sem cookie (primeiro acesso), mostra o kanban vazio com seletor de projeto.

**Prevenção:** Para estado de "última sessão" entre requisições, cookies são a ferramenta correta (stateless, funciona SSR, sem precisar de banco). localStorage não funciona no server.

---

## [2026-07-25] Client: form actions + boards realtime — o que NÃO fazer

**Contexto:** Na retro, criar/renomear colunas e cards só apareciam após F5; criar card falhava para o responsável. Na spec, criar task não atualizava a lista. Várias causas empilhadas (URL de action, `deserialize`, auth realtime, board sem sync, participante ausente, fetch sem invalidate).

**Regra canônica (checklist NÃO FAZER / FAZER):**
- `.agents/skills/client-realtime-and-actions.md`
- `.cursor/rules/architecture/client-realtime-and-actions.mdc`

### NÃO FAZER (resumo)

1. `fetch(window.location.href, { body: { action: '…' } })` — action vai em `?/nome`
2. `fetch('?/action')` + `res.json()` — usar `deserialize(await res.text())` + headers `Accept: application/json` e `x-sveltekit-action: true`
3. `authStore.save(token, null)` no realtime — usar `createBrowserClient(token, user)`
4. Board só no `onMount` sem `$effect(() => board.sync(data…))` — UI stale após `enhance`/`invalidateAll`
5. `fetch` que muta lista de `data.*` sem `update()` / `invalidateAll` / form `use:enhance`
6. Criar entidade com participantes sem incluir o criador, se create exige `canParticipate`
7. Schema com campo A e client enviando campo B (`userId` vs `participantId`)

### FAZER

Espelhar kanban/retro pós-fix: `createBrowserClient` + board no init + `$effect` sync + `onMount(start)`. Listas de `data` → form+`enhance`+`update()`. Mutations com retorno → `deserialize`. Criador vira participante no `createX`.

**Ocorrências originais:** handlers de `retro/+page.svelte`, `RetroColumn.svelte`, `SpecTaskCreator.svelte`.

---

## [2026-07-25] `window.prompt()` / `window.alert()` são proibidos — usar modal/inline input no lugar

**Contexto:** `RetroColumn.svelte` usava `const name = prompt('Novo nome:', column.name)` para renomear a coluna.

**Causa raiz:** `window.prompt()` e `window.alert()` são bloqueantes, sem estilo, não respeitam tema/a11y do app, e quebram a experiência de usuário. O usuário explicitamente definiu: "nunca use os alerts use modais no lugar".

**Padrão correto:** Estado reativo `$state` + input inline com confirmação/cancelamento, ou componente de modal reutilizável. Exemplo do próprio codebase: criação de card em `RetroColumn.svelte` já usa `showNewCardInput` + textarea (estado inline) — renomear deve seguir o mesmo padrão.

**Prevenção:** Proibir `window.prompt()` e `window.alert()` no codebase. Para confirmações de exclusão, usar `window.confirm()` é tolerável mas idealmente também deve migrar para modal. Substituir qualquer ocorrência futura imediatamente por estado reativo + input inline.

---

## [2026-07-25] Toggle de preview markdown deve existir tanto na criação quanto na edição

**Contexto:** A spec de documentos (`specification-documents`) exigia toggle de preview no editor markdown durante criação e edição (RF9). O toggle só foi implementado no modo de edição (`[docId]/+page.svelte`), não no formulário de criação (`specs/+page.svelte`).

**Causa raiz:** Quando uma feature tem dois momentos (create + edit) com UI semelhante, implementar o toggle só em um deles é fácil de passar batido. A criação tem um `<form method="POST">` tradicional enquanto a edição usa `$state` + `fetch()` — a diferença de implementação faz com que o toggle precisasse ser adaptado para cada contexto.

**Padrão correto:** Sempre que houver um textarea markdown — em qualquer formulário (criação ou edição) — incluir o toggle de preview. Se a mesma lógica aparece em dois lugares, extrair para um componente compartilhado (`MarkdownEditor.svelte`) que encapsula textarea + toggle + preview.

**Prevenção:** Ao implementar specs que mencionam "ao criar/editar", verificar explicitamente AMBOS os fluxos. Se um componente de editor é necessário em dois contextos, criar o componente uma vez e reusar.

---

## [2026-07-25] Nome da sprint deve vir pré-preenchido com numeração sugerida

**Contexto:** O formulário de criação de sprint (`projects/[id]/+page.svelte`) iniciava com o campo título vazio e placeholder "Ex: Sprint 2". O usuário precisa adivinhar qual número usar.

**Causa raiz:** A lógica de numeração (`Sprint ${num + 1}`) já existia no server (`finalizeSprint`), mas não era exposta ao client para o caso de criação manual. O número que o usuário digita manualmente pode conflitar com sprints existentes ou perder a sequência natural.

**Padrão correto:** Ao abrir o formulário de criação, pré-preencher o campo título com `Sprint ${sprints.length + 1}` (baseado nos sprints já carregados na página). O campo permanece editável para o usuário ajustar se quiser.

**Prevenção:** Sempre que houver uma sequência lógica/numérica implícita (sprints, versões, iterações), sugerir o próximo valor no formulário de criação como pré-preenchimento editável. Não depender apenas de placeholder.
