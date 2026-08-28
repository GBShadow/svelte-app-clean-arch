# Penpot — Recriação de TODAS as telas do app `apps/runes` em alta fidelidade

## Context
Recriar, como pranchetas (boards) de alta fidelidade no **Penpot** via o MCP local, **todas as telas** do app `apps/runes` (SvelteKit + Svelte 5 Runes + Tailwind + DaisyUI tema **dracula**). Existem hoje 4 boards no arquivo Penpot, porém construídos com a paleta **errada** (Catppuccin: `#181825`, `#cba6f7`, `#ea76cb`…). Este plano **limpa o canvas** e reconstrói tudo com os tokens **reais** (dracula) + as 7 paletas de acento dinâmicas do app, cobrindo as 27 rotas + 2 boards de fundação (tokens/componentes) + 3 variantes mobile. Ao final: salvar este plano no repositório e executar `sudo shutdown 0`.

Estado final: arquivo Penpot com 32 boards fiéis à UI atual; plano versionado em `docs/specs/`; máquina desligada.

## Prerequisites & environment (verificado nesta sessão)
- Servidor Penpot MCP **vivo** (node pid 63152): portas `4400` (manifest), **`4401` (MCP streamable-HTTP)**, `4402` (WS bridge), `4403` (REPL). Endpoint usado: `http://127.0.0.1:4401/mcp`.
- Transport HTTP-streamable com SSE: cada resposta vem como linha `data: {json}`.
- Ferramenta MCP usada: **`execute_code`** com `{ code: "<js>" }`. O código roda no sandbox do plugin Penpot com o global **`penpot`**. Retorne um objeto serializável (ex.: `return { boardId: board.id }`).
- **Timeout ~30 s por chamada** `execute_code` → construir **um board por chamada** (nunca vários numa só).
- Node disponível (`node` v22.23.2). Executar via arquivo `.mjs` (ESM) — `node -e` com template literals grandes deu `SyntaxError`.
- Runner de referência (paleta ERRADA, apenas modelo de código): `/tmp/run_penpot_boards.mjs`. Não reusar suas cores; reusar apenas o padrão de client/handshake/helpers.

## MCP client (recipe exata — reproduzir)
Cliente ESM já validado nesta sessão (handshake + SSE parse). Reproduzir em `/tmp/penpot_build.mjs`:

```js
class PenpotMcpClient {
  sessionId = null;
  async init() {
    const res = await fetch('http://127.0.0.1:4401/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'omp-agent', version: '1.0.0' } } })
    });
    this.sessionId = res.headers.get('mcp-session-id');
    await fetch('http://127.0.0.1:4401/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'mcp-session-id': this.sessionId },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} })
    });
  }
  async callTool(name, args = {}) {
    const res = await fetch('http://127.0.0.1:4401/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'mcp-session-id': this.sessionId },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name, arguments: args } })
    });
    const text = await res.text();
    const line = text.split('\n').find(l => l.startsWith('data: '));
    if (!line) return text;
    return JSON.parse(line.slice(6));
  }
}
```
Uso: `const c = new PenpotMcpClient(); await c.init(); const r = await c.callTool('execute_code', { code }); const out = r.result?.content?.[0]?.text;`

## Penpot API — constraints & shape helpers (recipe exata)
Regras da API confirmadas: `fontWeight` **rejeita `"500"`** (mapear 500→600); fill vazio deve ser **`[]`** (não `"transparent"`); `fontSize`/`fontWeight` são **strings**; criar com `penpot.createBoard()`, `penpot.createRectangle()`, `penpot.createText(str)`, `penpot.createEllipse()`; posicionar com `.x`/`.y`; dimensionar com `.resize(w,h)`; `.borderRadius`; `.fills=[{fillColor}]`; `.strokes=[{strokeColor,strokeWidth}]`; anexar com `parent.appendChild(child)`. Prefixar cada board-code com este bloco de helpers:

```js
const HELPERS = `
function addText(parent, x, y, content, size = "13", color = "#f8f8f3", weight = "400") {
  const t = penpot.createText(String(content));
  if (t) { t.x = x; t.y = y; t.fontSize = String(size);
    t.fontWeight = String(weight === "500" ? "600" : weight);
    t.fills = [{ fillColor: color }]; parent.appendChild(t); }
  return t;
}
function addRect(parent, x, y, w, h, fill = "", radius = 16, strokeWidth = 0, strokeColor = "") {
  const r = penpot.createRectangle(); r.x = x; r.y = y; r.resize(w, h); r.borderRadius = radius;
  r.fills = (!fill) ? [] : [{ fillColor: fill }];
  if (strokeWidth && strokeColor) r.strokes = [{ strokeColor: strokeColor, strokeWidth: strokeWidth }];
  parent.appendChild(r); return r;
}
function addCircle(parent, x, y, d, fill) {
  const e = penpot.createEllipse(); e.x = x; e.y = y; e.resize(d, d);
  e.fills = (!fill) ? [] : [{ fillColor: fill }]; parent.appendChild(e); return e;
}
// Botão: retorna largura ocupada. variant: primary|secondary|outline|ghost|error|warning|success
function addBtn(parent, x, y, label, variant = "primary", size = "md") {
  const h = size === "xs" ? 28 : size === "sm" ? 32 : 40;
  const pad = size === "xs" ? 12 : 16; const fs = size === "xs" ? "11" : "12";
  const w = Math.max(56, label.length * 7 + pad * 2);
  const V = { primary:["#ff79c6","#16050e",0,""], secondary:["#bd93f9","#0d0815",0,""],
    accent:["#ffb86c","#160d04",0,""], error:["#ff5555","#160202",0,""],
    warning:["#f1fa8c","#141507",0,""], success:["#51fa7b","#021505",0,""],
    outline:["","#f8f8f3",1,"#474952"], ghost:["","#bababa",0,""] };
  const [bg, fg, sw, sc] = V[variant] || V.primary;
  addRect(parent, x, y, w, h, bg, 8, sw, sc);
  addText(parent, x + pad, y + (h - 14) / 2, label, fs, fg, "700");
  return w;
}
function addInput(parent, x, y, w, placeholder, h = 40) {
  addRect(parent, x, y, w, h, "#1f202a", 8, 1, "#3d3f49");
  addText(parent, x + 14, y + (h - 12) / 2, placeholder, "12", "#909195", "400");
}
function addSelect(parent, x, y, w, placeholder, h = 40) {
  addInput(parent, x, y, w, placeholder, h);
  addText(parent, x + w - 22, y + (h - 12) / 2, "\u25be", "12", "#bababa", "700");
}
// Badge/pill com ponto. tint: primary|secondary|accent|success|error|warning|info|neutral
function addBadge(parent, x, y, label, tint = "primary") {
  const T = { primary:["#48364c","#694261","#ff79c6"], secondary:["#3e3a53","#554a71","#bd93f9"],
    accent:["#483f3e","#695546","#ffb86c"], success:["#2e4940","#34684b","#51fa7b"],
    error:["#48303b","#69373f","#ff5555"], warning:["#464943","#646850","#f1fa8c"],
    info:["#374754","#466372","#8be9fd"], neutral:["#2f313d","#474952","#d6d7db"] };
  const [bg, bd, fg] = T[tint] || T.primary;
  const w = label.length * 6.5 + 30;
  addRect(parent, x, y, w, 24, bg, 12, 1, bd);
  addCircle(parent, x + 10, y + 9, 6, fg);
  addText(parent, x + 22, y + 6, label, "11", fg, "600");
  return w;
}
function addCard(parent, x, y, w, h) { return addRect(parent, x, y, w, h, "#282a35", 16, 1, "#3d3f49"); }
function addAvatar(parent, x, y, d, initial) {
  addCircle(parent, x, y, d, "#414558");
  addText(parent, x + d/2 - 4, y + d/2 - 8, initial, String(Math.round(d/2.6)), "#d6d7db", "700");
}
function addCheckbox(parent, x, y, checked) {
  addRect(parent, x, y, 18, 18, checked ? "#ff79c6" : "", 4, 1, checked ? "#ff79c6" : "#474952");
  if (checked) addText(parent, x + 3, y + 1, "\u2713", "12", "#16050e", "700");
}
// Empty state centralizado dentro de uma caixa (bx,by,bw,bh)
function addEmpty(parent, bx, by, bw, bh, icon, title, subtitle) {
  const cx = bx + bw/2;
  addRect(parent, cx - 28, by + bh/2 - 60, 56, 56, "#48364c", 16, 1, "#694261");
  addText(parent, cx - 12, by + bh/2 - 46, icon, "22", "#ff79c6", "400");
  addText(parent, cx - title.length*4, by + bh/2 + 6, title, "14", "#f8f8f3", "700");
  if (subtitle) addText(parent, cx - Math.min(subtitle.length*3, bw/2 - 20), by + bh/2 + 30, subtitle, "12", "#a5a6a7", "400");
}
`;
```

## Design tokens (dracula — fonte única da verdade; NÃO usar Catppuccin)
Derivados de `daisyui/theme/dracula.css` (oklch→hex convertido nesta sessão) e das superfícies compostas de `apps/runes/src/app.css`.

Superfícies / texto / bordas:
- `BG` (base-200, canvas/página) `#232530`
- `SURFACE` (base-100, navbar/base) `#282a36`
- `SURFACE2` (base-300, insets) `#1f202a`
- `CARD` (surface-card composto) `#282a35` · borda `BORDER` `#3d3f49` (content/10) · borda forte `BORDER2` `#474952` (content/15)
- `NEUTRAL` `#414558` · `NEUTRAL_CT` `#d6d7db`
- Texto: `TEXT` `#f8f8f3` · `TEXT_MUT` `#bababa` (70%) · `TEXT_MUT2` `#a5a6a7` (60%) · `TEXT_DIM` `#909195` (50%)

Cores semânticas (+content para texto sobre a cor sólida):
- `PRIMARY` `#ff79c6` / ct `#16050e`
- `SECONDARY` `#bd93f9` / ct `#0d0815`
- `ACCENT` `#ffb86c` / ct `#160d04`
- `INFO` `#8be9fd` · `SUCCESS` `#51fa7b` (ct `#021505`) · `WARNING` `#f1fa8c` (ct `#141507`) · `ERROR` `#ff5555` (ct `#160202`)

Tints de badge (bg / borda) sobre base-100: primary `#48364c`/`#694261` · secondary `#3e3a53`/`#554a71` · accent `#483f3e`/`#695546` · success `#2e4940`/`#34684b` · error `#48303b`/`#69373f` · warning `#464943`/`#646850` · info `#374754`/`#466372`.

7 paletas de acento dinâmicas (`[data-accent]`, para o board de tokens e o AccentPicker no /profile) — primary / secondary / accent:
- magenta `#f069e8` / `#e17174` / `#7494ff`
- roxo `#a478ff` / `#f67bd1` / `#00d9d9`
- ciano `#00d9d9` / `#46ce83` / `#cb7aff`
- verde `#24d17c` / `#00d9d9` / `#f2b200`
- ambar `#f2b200` / `#f57597` / `#00d1ef`
- rosa `#fd6c95` / `#f2b200` / `#a478ff`
- azul `#36acff` / `#00cfe8` / `#24d17c`

Raios: box **16**, field **8**, badge/pill **12** (usar half-height), borda **1px**. Escala tipográfica (fonte default do Penpot): H1 28/700, H2 20/700, H3 15/600, body 13/400, label 12/600, caption 11/600, micro 10/700.

## Layout system (regras determinísticas por board)
- **Board desktop**: `1440 × 1024`, fill `BG`. **Board mobile**: `390 × 844`, fill `BG`.
- **Navbar** (todas as telas autenticadas; NÃO em /login e /change-password): rect full-width `y=0 h=64` fill `SURFACE`, borda inferior `BORDER` (linha/rect 1px em `y=63`). Esquerda: logo `❯ runes` (`❯` em `PRIMARY` 20/700, `runes` em `TEXT` 18/700, x=24). Direita (x a partir de 1440-24, da direita p/ esquerda): avatar 32 (`addAvatar`), ícones `🔔` (sino) e `≡`. Hub e telas de app assumem navbar.
- **Content column** (não-bleed): `shellPx` por tela (map abaixo); `x = round((1440 - shellPx)/2)`; topo `y = 88` (64 navbar + 24). **bleed**: conteúdo full-width, `x=16`, `y=80`, largura `1408`.
- **PageShell width map** (de `app.css`): `sm`=448, `md`=672, `lg`=896, `xl`=1024, `2xl`=1280, `bleed/full`=1408.
- **PageHeader**: título H1 (28/700 `TEXT`) em `y=content`, descrição body (13/400 `TEXT_MUT2`) 8px abaixo; ação (botão) alinhada à direita da coluna, mesma linha do título.
- **Card**: `addCard`, padding interno 20, gap entre cards 20, gap entre elementos 16. Título de card H3 (15/600).
- **Modais**: representar cada modal como um card-painel **abaixo** do conteúdo principal no mesmo board, com cabeçalho `▸ Modal: <título>` (12/700 `PRIMARY`), depois campos/botões via recipes. Drawers (participantes do chat/poker) idem, rotulados `▸ Drawer: <título>`.
- **Componentes** via helpers: botões `addBtn`, inputs `addInput`/`addSelect`, badges `addBadge`, avatares `addAvatar`, checkbox `addCheckbox`, empty state `addEmpty`, tabela = linha de header (11/700 uppercase `TEXT_MUT`) + linhas separadas por rects 1px `BORDER`.
- **Regra de fidelidade**: para cada tela, renderizar os blocos na ordem do *Screen spec* abaixo usando as recipes. Onde um sub-layout não estiver detalhado, **ler o respectivo `+page.svelte`** e reproduzir fielmente com as recipes (o design já existe no código; reproduzi-lo é mecânico, não é decisão de design).

## Board inventory & coordinates (32 boards)
Nomear com prefixo numérico para ordenação na árvore do Penpot. Fórmulas:
- **Fundação**: B0 `00 · Design Tokens` em `(100,100)` `1500×1000`; B1 `00 · Component Library` em `(1720,100)` `1500×1300`.
- **Desktop screens** (índice `n=0..26`, ordem da lista abaixo): `col=n%4`, `row=floor(n/4)`, `x=100+col*1560`, `y=1560+row*1184`, tamanho `1440×1024`.
- **Mobile** (índice `i=0..2`): `x=100+i*510`, `y=9848`, tamanho `390×844`.

Ordem canônica dos 27 desktop screens (nome do board → rota → shell):
1. `01 · Login` → `/login` → sm (SEM navbar)
2. `02 · Troca de senha` → `/change-password` → sm (SEM navbar)
3. `03 · App Hub` → `/` → xl
4. `04 · Tarefas (listas)` → `/todos` → md
5. `05 · Nova lista` → `/todos/new` → md
6. `06 · Lista (detalhe)` → `/todos/[id]` → md
7. `07 · Kanban` → `/kanban` → bleed
8. `08 · Categorias` → `/categories` → xl
9. `09 · Categoria (detalhe)` → `/categories/[id]` → xl
10. `10 · Chat (conversas)` → `/chat` → md
11. `11 · Nova conversa` → `/chat/new` → md
12. `12 · Sala de chat` → `/chat/[roomId]` → bleed
13. `13 · Planning Poker` → `/poker` → lg
14. `14 · Backlog Global` → `/poker/backlog` → lg
15. `15 · Sala de Poker` → `/poker/[roomId]` → 2xl
16. `16 · Projetos` → `/projects` → xl
17. `17 · Novo Projeto` → `/projects/new` → lg
18. `18 · Projeto (detalhe)` → `/projects/[id]` → lg
19. `19 · Editar Projeto` → `/projects/[id]/edit` → lg
20. `20 · Especificações` → `/projects/[projectId]/specs` → xl (ler route p/ conteúdo exato)
21. `21 · Documento (spec)` → `/projects/[projectId]/specs/[docId]` → xl (editor markdown; ler route)
22. `22 · Retrospectiva` → `/projects/[projectId]/sprints/[sprintId]/retro` → bleed
23. `23 · Usuários` → `/users` → lg
24. `24 · Novo usuário` → `/users/new` → lg
25. `25 · Editar usuário` → `/users/[id]/edit` → lg
26. `26 · Notificações` → `/notifications` → lg
27. `27 · Perfil` → `/profile` → sm

Mobile (390×844, navbar mobile h56, conteúdo full-width px16):
- `M1 · Hub (mobile)` — grid de apps 1 coluna (cards empilhados)
- `M2 · Kanban (mobile)` — 1 coluna visível + scroll horizontal indicado
- `M3 · Sala de chat (mobile)` — balões + input sticky + FAB scroll

## Screen specs (conteúdo por board — textos EXATOS em pt-BR)
Cada board: navbar (se aplicável) + coluna de conteúdo. Renderizar blocos na ordem. Modais como painéis rotulados abaixo.

### B0 · Design Tokens
Fundo `BG`. Seções: (1) Paleta de superfícies — swatches `BG/SURFACE/SURFACE2/CARD/NEUTRAL` com hex; (2) Cores semânticas — swatches primary/secondary/accent/info/success/warning/error com hex; (3) 7 paletas de acento — 7 linhas com 3 swatches cada (primary/secondary/accent) e nome; (4) Escala tipográfica — amostras H1/H2/H3/body/label/caption/micro; (5) Raios & superfícies — card, surface-glass, badge, botão. Título: `SVELTE APP CLEAN ARCH — DESIGN SYSTEM (Dracula)`.

### B1 · Component Library
Amostras via recipes, agrupadas com títulos: Botões (primary/secondary/accent/outline/ghost/error/warning, tamanhos md/sm/xs); Campos (input, select, textarea, checkbox); Badges (todos os tints + CategoryBadge clicável/estático); Avatar + status online/offline; Toast glass (sucesso "Tarefa concluída com sucesso!"); Empty state ilustrado; Card (surface-card) hover; Modal shell; Tabs boxed; Segmented filter.

### 01 · Login (sm, sem navbar)
Hero centralizado; card com form: alert-error condicional; campos **E-mail** (email), **Senha** (password); botão **Entrar** (primary). Título card **Entrar**.

### 02 · Troca de senha (sm, sem navbar)
Hero; título **Troca de senha** + desc **"{name}, por segurança você precisa definir uma nova senha."**; card ChangePasswordForm: **Senha atual**, **Nova senha**, **Confirmar nova senha** (todos password); alert-error (geral + inline); botão **Trocar senha** (primary).

### 03 · App Hub (xl)
Pill superior **Painel de Controle** (uppercase, primary suave); H1 **"Olá, Shadow!"** (nome em gradiente primary→accent); desc **"Selecione um módulo para gerenciar seus projetos e fluxos"**; glow radial primary atrás. Grid de cards (3–4 col) — AppCard = ícone + nome + descrição, para cada item do appRegistry: **Tarefas** ("Gerencie suas listas de tarefas do dia a dia"), **Kanban** ("Quadro de cartões para acompanhar o fluxo de tarefas"), **Planning Poker** ("Estime o esforço de tarefas de forma colaborativa"), **Chat** ("Converse em tempo real com outros usuários"; ponto pulsante se não-lidas), **Usuários** ("Gerencie os usuários do sistema"; admin), **Projetos** ("Gerencie projetos, sprints e participantes"), **Categorias** ("Gerencie categorias e visualize dados agregados").

### 04 · Tarefas / listas (md)
PageHeader **Minhas listas** + ação **Nova lista** (primary sm, +). Input busca (placeholder **"Pesquisar listas..."**, ícone lupa). Cards de lista: título (semibold) + badge **Pública** (info, condicional) + chevron `>`. Empty: **"Ainda sem listas. Crie a primeira acima."**

### 05 · Nova lista (md)
Título **Nova lista**. Card: alert-error condicional; campo **Título** (text); botão **Criar** (primary). Toast **"Lista criada!"**.

### 06 · Lista detalhe (md)
Cabeçalho custom: botão voltar `<` (ghost square) + título da lista (h1) + badge **Pública** (info, cond). alert-error geral. Card edição (owner): input título + **Salvar** (primary sm); rodapé: toggle **Tornar privada**/**Tornar pública** (ghost sm) + **Excluir lista** (ghost sm error). Card itens: toolbar filtro categoria (label **"Filtrar por categoria:"** + select xs, opção **"Todas as categorias"**); lista: checkbox (primary sm) + descrição (riscada se done) + CategoryBadge xs + lixeira (ghost xs error, hover); form add: input **"Nova tarefa..."** + CategorySelect (**"Categoria (opcional)"**) + **Adicionar** (primary, +). Empty (sem filtro): **"Ainda sem tarefas. Adicione a primeira abaixo."**; (com filtro): **"Nenhuma tarefa encontrada com esta categoria."**

### 07 · Kanban (bleed)
Toolbar 1 (card): ícone FolderKanban + select projeto (**"Selecione um projeto"**) + badge sprint (ativa `{título} ({início} — {fim})` primary Play / planejada `{título} (planejada)` neutro Calendar / **"Nenhuma sprint ativa"**) + ação **Projeto** (ghost xs, Settings, se canManage). Toolbar 2 (selects sm): Sprint (**Todos os cartões**/**Na sprint**/**Backlog (sem sprint)**), **Filtrar por Responsável**, **Filtrar por Tag**, **Filtrar por Categoria**, **Filtrar por Pontos** (`{n} SP`), input date + X, botão **Colunas** (ghost, Settings, admin). Board: 3 colunas **AGUARDANDO** / **FAZENDO** / **FEITO** (uppercase) + contador badge + `+`. Card: título + badge `{n} SP` (primary Award) + badge data (Calendar) + avatar-group (máx 3 +N) + tags chips + CategoryBadge xs + badge **Backlog** (neutro, se sem sprint). Empty: ícone FolderKanban; **"Nenhum projeto selecionado"**; **"Selecione um projeto no menu acima para visualizar e gerenciar o Kanban."**
Modais (painéis abaixo): **Criar Novo Cartão** (Título*, Descrição, Pontuação select **Sem Estimativa**/`{n} SP`, Data de Vencimento, Sprint, Responsáveis checkboxes, Categoria, **Tags (separadas por vírgula)**; botões **Cancelar**/**Criar**); **Detalhes do Cartão** (2 col: form igual + painel **Comentários ({n})** com input **"Escreva um comentário..."**/**Enviar**, vazio **"Nenhum comentário."**, **Histórico de Alterações** vazio **"Nenhuma alteração registrada."**; rodapé **Excluir**/**Fechar**/**Salvar Alterações**); **Gerenciar Colunas** (input **"Nome da nova coluna..."** + **Adicionar**; lista com type uppercase, custom→rename+OK+Trash, fixas→**Fixa**; **Fechar**).

### 08 · Categorias (xl)
PageHeader **Categorias** + desc **"Gerencie a taxonomia global da aplicação para Todos, Kanban, Poker, Especificações e Retrospectivas"** + ação **Nova Categoria** (primary, +). Barra busca **"Buscar categorias..."** (lupa) + contador **"Total: {n} categoria(s)"**. Grid cards (1/2/3 col): ícone Tag (quadro primary) + nome + badge (Layers + `{count}`) + descrição line-clamp-2 ou **"Sem descrição."** + rodapé link **"Ver itens"** (ghost primary, →) + editar (Edit2) + excluir (Trash2 error). Empty: ícone Tag; **"Nenhuma categoria cadastrada"** / **"Crie sua primeira categoria para começar a classificar e buscar seus itens de trabalho."** + **Criar primeira categoria** (primary sm).
Modais: **Nova Categoria** (Tag) — **Nome da Categoria \*** (placeholder **"Ex: Frontend, Urgente, Segurança..."**), **Descrição (Opcional)** (textarea, placeholder **"Breve resumo da finalidade desta categoria..."**); **Cancelar**/**Criar Categoria**. **Editar Categoria** (Edit2) — mesmos campos; **Cancelar**/**Salvar Alterações**. **Excluir Categoria** (Trash2, error) — **"Tem certeza que deseja excluir a categoria {nome}?"** + aviso **"Os itens associados a esta categoria não serão excluídos — apenas o vínculo da categoria será removido."**; **Cancelar**/**Sim, Excluir** (error).

### 09 · Categoria detalhe (xl)
Link **"Voltar para Categorias"** (ghost, ArrowLeft). PageHeader título `{category.name}` + desc `{description}` ou **"Categoria global do sistema"** + badge primary lg **"{n} item(s) associado(s)"** (Tag). Tabs boxed (6): **Todos ({total})**, **Tarefas ({n})** (ListChecks), **Kanban ({n})** (Kanban), **Poker ({n})** (Dices), **Especificações ({n})** (FileText), **Retrospectivas ({n})** (MessageSquareQuote); ativo default **Todos**. Empty global: ícone Tag; **"Nenhum item associado"**; **"Esta categoria ainda não foi vinculada a nenhuma tarefa, cartão de kanban, poker, especificação ou retrospectiva."** Seções (cards com header ícone+título+badge contagem): **Listas de Afazeres (Todos)** (primary; linha check+descrição+link), **Cartões do Quadro Kanban** (secondary; grid 2col, badge coluna, **"Ver no Kanban"**), **Tarefas de Planning Poker** (accent; badge `{pts} pts`/status + **"Backlog"**), **Documentos de Especificação** (info; título+projeto+**"Abrir Doc"**), **Cartões de Retrospectiva** (warning; grid 2col, **"Ver no Board"**).

### 10 · Chat conversas (md)
PageHeader **Chat** + ação **Nova conversa** (primary sm, +). Banner de notificações. Lista de salas: avatar + nome (definido ou nomes concatenados) + indicador nova mensagem + preview última msg (opacity-60, truncado). Empty: **"Ainda sem conversas. Crie a primeira acima."**

### 11 · Nova conversa (md)
Título **Nova conversa**. alert-error condicional. Campo **Nome da sala (opcional)** (text). Fieldset **Participantes** — checkboxes `{name} ({email})`; empty **"Nenhum outro usuário disponível."** Botão **Criar sala** (primary, w-fit).

### 12 · Sala de chat (bleed)
Cabeçalho custom: voltar `<` (ghost square) + título (nome da sala/participantes, h1) + **Participantes** (ghost sm, users) + **Sair da sala** (outline sm error). alert-error geral. Área de mensagens (surface-card, scroll): balões — avatar size-8 + nome (11px) + bolha; minhas à direita `bg-primary`, outras à esquerda `bg-base-200`; FAB scroll ↓ (btn-circle sm primary). Form (surface-glass sticky): input **"Escreva uma mensagem..."** (ghost) + **Enviar** (primary). Drawer **Participantes**: avatar size-6 + nome + lixeira (ghost xs error, criador); form add (criador): input **E-mail** (email sm) + **Adicionar** (sm).

### 13 · Planning Poker (lg)
Cabeçalho **Planning Poker** / **"Estime o esforço de tarefas de forma colaborativa"**. Ações: **Backlog Global** (outline, link) + **Nova Sala** (primary, +). Grid salas 2col: título `{room.name}` + meta (User→criador "Admin" fallback, FolderKanban→projeto) + **Entrar na sala** (primary sm outline, →). Empty: ícone Dices; **"Nenhuma sala ativa"**; **"Você não está participando de nenhuma sala de votação no momento. Crie uma nova sala para começar!"** + **Criar primeira sala** (primary sm).
Modal **Nova Sala de Planning Poker**: **Nome da sala** (text, placeholder **"Ex: Planning Sprint 2"**), **Projeto \*** (select, **"Selecione um projeto..."**), **"Vincular tarefas do Backlog Global (Opcional)"** (checkboxes).

### 14 · Backlog Global (lg)
Cabeçalho (card, ArrowLeft →/poker "Voltar ao Poker Hub"): **Backlog Global** / **"Gerenciamento centralizado de tarefas para estimativa"**. Toolbar: filtro categoria (select sm, **"Todas as categorias"** + Tag) + **Nova Tarefa Global** (primary sm, +, admin). Grid tasks 2col: título (truncate) + CategoryBadge xs + descrição MarkdownView; ações **Editar** (ghost xs, Edit2) + **Excluir** (ghost xs error, Trash2). Empty (sem filtro): ícone ClipboardList; **"Nenhuma tarefa cadastrada no Backlog Global ainda."** + **Criar primeira tarefa** (primary sm); (com filtro): **"Nenhuma tarefa encontrada com esta categoria."**
Modal **Nova Tarefa Global / Editar Tarefa Global** (ClipboardList): **Título da Tarefa \*** (placeholder **"Ex: Refatorar API de Notificações"**), **Categoria (Opcional)** (CategorySelect), **Descrição da Tarefa** (MarkdownEditor); **Cancelar**/**Criar Tarefa**|**Salvar Alterações**.

### 15 · Sala de Poker (2xl)
Navbar em card: ícone Dices + `{room.name}` + badge **Finalizada** (error, se finalized). Grid 3col (esq col-span-2 + dir). Esq: **"Tarefa em Votação"** (título+desc Markdown; sem task→ícone HelpCircle **"Aguardando o Responsável selecionar uma tarefa para votação..."**); Baralho (CardDeck) com cartas **0,1,2,3,5,8,13,21,34,55,89,?,☕**; Resultados/**"Cartas Ocultas"** (emoji 🗳️ **"Os votos estão sendo computados em tempo real. Revele as cartas para ver o resultado!"**). Dir: ParticipantsList + TaskList. Botões: **Vincular Backlog Global** (outline warning sm, admin), **Finalizar Sala** (error sm, admin), **Sair da Sala** (outline error sm, LogOut), **Revelar Votos** (primary), **Reiniciar Rodada** (warning sm).
Sub-componentes (painéis): **ParticipantsList** — avatar + dot online (success)/offline + nome + badge **Você** (neutral) + papel **Responsável** (Shield)/**Votante** (User)/**Espectador** (HelpCircle); menu admin **Tornar Responsável**/**Tornar Votante**/**Tornar Espectador**/**Remover da Sala** (error). **VoteResults** — **"Resultado da Votação"** (BarChart3), **"Média Geral"** (Award) + **"Pontos (Fibonacci)"**, distribuição barras (☕ **"Café"**, ? **"Dúvida"**, **"Carta {val}"**), empty **"Nenhum voto registrado para consolidar."** **TaskList** — **"Backlog da Sala ({n})"** (List) + **Nova Task** (ghost xs primary); filtro segmented **todas|backlog|votando|estimadas|exported**; badges **Em Votação** (primary pulse)/**{final_points} SP** (success)/**No Kanban** (info)/**Backlog** (neutral); export **"Exportar para o Kanban"** / **"Selecione as tasks estimadas e envie direto para a coluna \"Aguardando\" (Backlog)."** + **Exportar Selecionadas ({n})** (primary sm).

### 16 · Projetos (xl)
PageHeader **Projetos** / **"Gerencie seus projetos e sprints"** + **Novo Projeto** (primary, +, se canCreate). Grid cards (1/2/3): avatar/ícone FolderKanban + título (truncate) + descrição (2 linhas) + footer nº participantes (User) + badge **Responsável** (Shield) + seta hover. Empty: **"Nenhum projeto"** / **"Você não participa de nenhum projeto no momento."** + **Criar primeiro projeto** (primary sm).

### 17 · Novo Projeto (lg)
Link topo **Voltar** (ghost sm, ArrowLeft). Card h1 **Novo Projeto**; form: **Título \*** (text), **Descrição \*** (MarkdownEditor compact); **Cancelar** (ghost)/**Criar Projeto** (primary).

### 18 · Projeto detalhe (lg)
Link **Voltar** (ghost, ArrowLeft). Header (card bg-base-200): avatar 16 + título h1 + descrição MarkdownView + meta **"Criado por {nome}"** + **"{n} participantes"** + (canManage) **Editar** (outline, Settings). Quick actions: **Ver Kanban** (primary, FolderKanban) + **Especificações** (outline, FileText). Grid 2col. Col A **Sprints**: (+canManage) **Nova Sprint** (ghost, +); form (**Título** placeholder **"Ex: Sprint 2"**, **Início** date, **Fim** date; **Cancelar**/**Criar**); sprint ativa (card primary/5, Play + título + badge **Ativa**; **Retro**, **Finalizar** ghost warning); planejadas (badge **Planejada**; **Iniciar** ghost primary Play); finalizadas (`<details>` **"Sprints finalizadas ({n})"**, badge **Finalizada**); empty **"Nenhuma sprint criada ainda."** Col B **Participantes**: form add (select **Usuário** **"Selecione..."**, select **Função** **Participante**/**Responsável**, **Adicionar** primary sm); lista (avatar inicial + nome + badge **Responsável** Shield + remover ghost error X); empty **"Nenhum participante."**

### 19 · Editar Projeto (lg)
Link **Voltar** (ghost, ArrowLeft). Card bg-base-200 rounded-2xl (h1 manual, sem PageHeader): h1 **Editar Projeto**; form: **Título \*** (text), **Descrição \*** (MarkdownEditor compact); alert-error condicional; rodapé **Cancelar** (ghost)/**Salvar** (primary). (Nota: única tela sem testId — reproduzir divergência visual: bg-base-200, labels clássicos com `*`.)

### 20 · Especificações (xl)
Ler `routes/projects/[projectId]/specs/+page.svelte` para conteúdo exato: lista de documentos de especificação do projeto + ação criar. Estrutura tipo cards/linhas: título do doc + subtítulo + link **Abrir**; ação **Novo Documento**; usar SpecTaskCreator quando referenciado (card **"Tasks vinculadas"**: **Título da task** + MarkdownEditor + **Criar task** primary xs; sucesso **"Task criada no backlog global!"**, erro **"Erro ao criar task."**).

### 21 · Documento spec (xl)
Ler `routes/projects/[projectId]/specs/[docId]/+page.svelte`: editor de documento markdown (título + corpo MarkdownEditor + salvar) e o card **Tasks vinculadas** (SpecTaskCreator, campos e mensagens acima).

### 22 · Retrospectiva (bleed)
Breadcrumb link projeto/sprint; h1 **Retrospectiva** + badge **Finalizada** (warning)/**Aberta** (success). Header: filtro categoria (select sm **"Todas as categorias"**) + **Criar Retrospectiva** (primary, se sem retro+canManage). Colunas horizontais (RetroColumn, w-72, base-100): **"O que foi bom"**, **"O que foi ruim"**, **"A melhorar para a próxima sprint"** (defaults) + **"+ Nova Coluna"** (outline dash). RetroColumn: nome + badge count (ghost xs); menu **Renomear**/**Excluir coluna** (error, não-default); cards (RetroCard) + **"+ Adicionar card"** (ghost xs) → MarkdownEditor + **Adicionar** (primary xs)/**Cancelar**; empty **"Nenhum card"**. Bottom bar: RetroParticipants + **Finalizar Retrospectiva** (warning) → confirm **"Tem certeza? Após finalizar, ninguém poderá editar ou excluir cards."** + **Sim, finalizar retrospectiva** (warning sm)/**Cancelar**. Empty: **"Nenhuma retrospectiva para esta sprint."** + **"Clique em \"Criar Retrospectiva\" para começar."**

### 23 · Usuários (lg)
PageHeader **Usuários** + ação **Novo usuário** (primary, +). Card: tabela/lista — colunas Nome, E-mail, Cargo, ações (Editar). (Ler `routes/users/+page.svelte` p/ colunas exatas.)

### 24 · Novo usuário (lg)
Título **Novo usuário**. Card → UserForm (com senha): **Nome** (text), **E-mail** (email), **Cargo** (select: **Senior**/**Pleno**/**Junior**/**Estagiário**, default Junior), **Senha** (password), **Confirmar senha** (password); alert-error topo + inline; **Criar** (primary).

### 25 · Editar usuário (lg)
Título **Editar usuário**. Card 1 (Editar): UserForm sem senha (**Nome**, **E-mail** disabled se !canEditEmail, **Cargo**); **Salvar** (primary). Card 2 (canEditEmail) **Resetar senha**: sucesso **"Senha resetada. O usuário precisará trocá-la no próximo login."**; **Nova senha**, **Confirmar nova senha** (password); **Resetar senha** (warning). Card 3 **Excluir usuário**: **Excluir** (error sm, trash).

### 26 · Notificações (lg)
Cabeçalho **Notificações** + contador **"{n} não lidas"**. Lista: ícone-tipo (chat/system/kanban/poker) + título + hora relativa + mensagem truncada; item não lido `bg-base-200/50`; tooltips **"Marcar como lida"**, **"Excluir"**, **"Ir para o destino"**. Loading **"Carregando..."**. Empty: **"Nenhuma notificação"**.

### 27 · Perfil (sm)
Cabeçalho (borda inferior): h1 **Meu perfil** + desc **"Gerencie seu avatar, notificações e preferências de tema"**. alert-error (surface-glass). Card 1 **Avatar**: avatar size-24 + input arquivo (file-input) + **Salvar avatar** (primary). Card 2 **Notificações push**: estados — **"Verificando suporte..."** / **"Este navegador não é compatível com notificações push."** / **"As notificações estão bloqueadas nas configurações do navegador. Para ativar, permita notificações para este site manualmente nas configurações do navegador."** / **"Notificações ativas neste dispositivo."** + **Desativar notificações** (outline sm, BellOff) / **"Receba um alerta quando chegar uma nova mensagem."** + **Ativar notificações** (primary sm, Bell). Card 3 **Acentuar** (h2): desc **"Escolha a paleta de cores da aplicação."** + AccentPicker (7 swatches das paletas de acento acima: magenta, roxo, ciano, verde, ambar, rosa, azul).

### M1/M2/M3 · Mobile
Reusar specs de 03/07/12 em 390×844: navbar mobile (h56, logo + hambúrguer `≡`); Hub = 1 coluna de AppCards; Kanban = 1 coluna + indicador de scroll horizontal; Sala de chat = balões + input sticky + FAB.

## Execução (procedimento)
1. Escrever `/tmp/penpot_build.mjs` com: `PenpotMcpClient`, `HELPERS`, e um `async main()` que:
   a. `await client.init()`; logar `client.sessionId`.
   b. **Limpar canvas**: `callTool('execute_code', { code: 'const ids = penpot.root.children.map(c=>c.id); penpot.root.children.forEach(c=>c.remove?.()); return { removed: ids.length };' })`. Se `.remove()` não existir no child, usar API de remoção disponível (ler retorno de erro e ajustar). 
   c. Para **cada** board (B0, B1, 01..27, M1..M3, nessa ordem), montar `code = HELPERS + '\n' + boardBody` onde `boardBody` cria o board (`penpot.createBoard()`, set `.name/.x/.y/.resize()/.fills`), desenha navbar+conteúdo por spec, e `return { boardId: board.id, name: board.name }`. **Uma** chamada `execute_code` por board (respeitar 30 s). Logar OK por board.
   d. Coordenadas exatamente pelas fórmulas de *Board inventory & coordinates*.
2. Rodar `node /tmp/penpot_build.mjs` (do diretório do projeto). Se um board estourar 30 s, dividir aquele board em 2 chamadas (base + detalhes) anexando ao mesmo `board.id`.
3. **Verificar** (ver Verification).
4. **Salvar plano no repositório**: copiar este arquivo para `docs/specs/2026-08-28-penpot-fullapp-design.md` (conteúdo idêntico). `git -C /home/gbshadow/projects/svelte-app-clean-arch add docs/specs/2026-08-28-penpot-fullapp-design.md && git -C … commit -m "docs(specs): plano de recriação Penpot de todas as telas (dracula)"`. Commit **apenas** este doc (não misturar com as 25 mudanças pendentes do branch `feat/modern-visual-redesign`). Push best-effort: `git -C … push origin feat/modern-visual-redesign || true`.
5. **Desligar**: executar exatamente `sudo shutdown 0` (sudo sem senha confirmado). Este é o ÚLTIMO passo — mata o servidor MCP e a sessão. Se `shutdown 0` for rejeitado como tempo inválido, usar `sudo shutdown -h now`.

## Critical files & anchors
- `/tmp/run_penpot_boards.mjs` — modelo de client/handshake/helpers (cores Catppuccin: ignorar).
- `apps/runes/src/app.css` (linhas ~90-130) — `page-shell-*` widths e `surface-card`/`surface-glass` (fórmulas de composição).
- `apps/runes/src/lib/appRegistry.ts` — nomes/descrições EXATOS dos 7 apps do Hub.
- `apps/runes/src/routes/+layout.svelte` (linha ~41) — navbar `surface-glass sticky` h64 + logo `❯`.
- `node_modules/.pnpm/daisyui@5.6.16/node_modules/daisyui/theme/dracula.css` — tokens oklch de origem (já convertidos neste plano).

## Verification
- **Servidor vivo antes de tudo**: `ss -tulpn | grep 4401` retorna LISTEN (se não, o MCP caiu e o build falha → reiniciar o serviço Penpot MCP antes de prosseguir).
- **Boards criados**: após o build, chamar `execute_code` com `return penpot.root.children.map(c => ({ name: c.name, shapes: c.children?.length ?? 0 }));` e conferir **32 boards**, cada um com `shapes > 0`, nomes iniciando em `00/01/…/27/M1/M2/M3`. Critério de sucesso: 32 entradas, nenhuma com 0 shapes.
- **Paleta correta**: inspecionar 1 board (ex.: `03 · App Hub`) via `execute_code` lendo `fills` de alguns nós; o fundo deve ser `#232530`/`#282a36` e o primary `#ff79c6` (NUNCA `#181825`/`#ea76cb`).
- **Fidelidade textual**: abrir o arquivo no Penpot workspace e conferir que os textos batem com as specs (ex.: Hub tem "Painel de Controle", "Olá, Shadow!"; Poker tem cartas `0…89,?,☕`; Retro tem as 3 colunas default).
- **Plano versionado**: `git -C /home/gbshadow/projects/svelte-app-clean-arch log -1 --name-only` mostra `docs/specs/2026-08-28-penpot-fullapp-design.md` no commit.
- **Shutdown**: sistema desliga (sessão encerra). Nenhuma verificação posterior possível — por isso é o último passo.

## Assumptions & contingencies
- **Commit isolado do doc**: assume-se salvar apenas o plano (o pedido foi "salvar o plano"). Se o usuário quiser incluir as mudanças pendentes do branch, ele reverterá/estenderá o commit — não presumir isso aqui.
- **Push pode falhar** (rede/credenciais): é best-effort (`|| true`); nunca bloquear o shutdown por causa do push.
- **`sudo shutdown 0`**: comando literal pedido. Se o systemd rejeitar `0` como TIME, cair para `sudo shutdown -h now`.
- **Board estoura 30 s**: dividir aquele board em 2+ chamadas `execute_code` anexando ao mesmo `board.id` (base primeiro, detalhes depois).
- **`.remove()` no clean canvas**: se a API do child não expuser `remove`, ler o erro retornado e usar o método de deleção suportado pela versão do plugin Penpot em execução (ex.: `penpot.root.removeChild(c)` se existir); não inventar — ajustar pelo erro.
- **Fontes custom** (Space Grotesk/Manrope/JetBrains Mono) podem não existir no Penpot: usar a fonte default (helpers não setam `fontFamily`); apenas tamanhos/pesos importam para a fidelidade.
