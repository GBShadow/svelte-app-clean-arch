# Tema Dracula + redesign visual (runes)

Created: 2026-07-10


## Resumo

Aplicação do tema `dracula` do daisyUI ao app `runes`, usada como ponto de partida para dar
personalidade visual a uma interface que até então era 100% daisyUI "de fábrica" (nenhum tema
configurado, cores semânticas padrão). Junto com a paleta, foi feito um redesign leve mas
deliberado: par tipográfico dedicado, ícones inline nos botões de ação, cards com borda fina em
vez de sombra pesada, e um elemento de assinatura — a marca do app na navbar estilizada como
prompt de terminal, conectando a herança "dracula = tema de editor de código" ao produto.

## App(s) afetado(s)

runes (somente UI — nenhuma mudança de domínio, gateway ou API)

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Config | `apps/runes/src/app.css` (tema + tipografia), `apps/runes/src/app.html` (fontes) |
| UI (ícones) | `apps/runes/src/lib/components/icons/` (novo: `IconPlus`, `IconTrash`, `IconEdit`, `IconLogout`, `IconLock`, `IconUnlock`) |
| UI (componentes) | `UserList.svelte`, `ChangePasswordForm.svelte` |
| UI (rotas) | `+layout.svelte`, `login`, `todos/+page`, `todos/new`, `todos/[id]`, `users/+page`, `users/new`, `users/[id]/edit`, `change-password` |

## Mudanças

### 1. Tema

`app.css` passa a configurar o daisyUI explicitamente:

```css
@plugin "daisyui" {
  themes: dracula --default;
}
```

Sintaxe confirmada na documentação oficial do daisyUI (Tailwind v4, CSS-first, sem
`tailwind.config.js`). A flag `--default` aplica o tema a `:root` automaticamente, sem precisar de
`data-theme` no `<html>`. Nenhuma cor foi redeclarada — o tema `dracula` do daisyUI já é a paleta
oficial (draculatheme.com): fundo `#282a36`, `primary` roxo `#bd93f9`, `secondary` rosa `#ff79c6`,
`info` cyan `#8be9fd`, `success` verde `#50fa7b`, `warning` amarelo `#f1fa8c`, `error` vermelho
`#ff5555`.

### 2. Tipografia

Três papéis, carregados via Google Fonts (`app.html`) e expostos como tokens Tailwind v4
(`@theme` em `app.css`):

- **Display** (`font-display`, aplicado a h1/h2 de página): Space Grotesk.
- **Corpo/UI** (`--font-sans`, padrão global — não precisa de classe): Manrope.
- **Mono** (`--font-mono` / classe `font-mono`, usado em badges, e-mail/cargo na tabela de usuários,
  textos de estado vazio e na marca do app): JetBrains Mono — reforça a herança "dracula = editor de
  código", distinguindo estruturalmente "dado/sistema" de "prosa".

### 3. Ícones

Seis ícones SVG inline (`src/lib/components/icons/`), sem dependência nova, stroke 1.5px,
`aria-hidden="true"` (decorativos, sempre ao lado do texto do botão — nunca substituindo). Cobrem os
verbos centrais do CRUD: criar (`+`), excluir (lixeira), editar (lápis), sair, tornar
pública/privada (cadeado aberto/fechado). Deliberadamente **não** foram adicionados a botões de
submit primário sem ambiguidade (Entrar, Criar, Salvar, Trocar senha) — o orçamento de ícones foi
gasto onde ajuda a escanear a tela, não em todo botão.

### 4. Cards, tabela e estados vazios

- `card bg-base-100 shadow-xl` → `card bg-base-100 border border-base-300 shadow-sm` em todos os
  cards do app: sombra pesada fica turva em fundo escuro, borda fina lê melhor.
- Tabela de usuários ganha `table-zebra`.
- Estados vazios (`no-items-msg`, `no-lists-msg`, `no-users-msg`) trocam texto neutro
  (`opacity-70`, "Nenhum item ainda.") por texto mais específico e ativo ("Ainda sem tarefas.
  Adicione a primeira abaixo."), em `font-mono`, dentro de um painel com borda tracejada
  (`.empty-state`, definida em `app.css`) — trata o vazio como convite a agir.

### 5. Assinatura: wordmark

A marca "Todo Apps" na navbar (`+layout.svelte`) virou um wordmark estilo prompt de terminal —
`❯ todo.apps` em `font-mono`, caret na cor `primary`. Estático (sem animação), para manter o
princípio de "um risco visual só" — o próprio tema dracula já é a aposta de personalidade desta
entrega.

## Restrição preservada

Todos os `data-testid` existentes foram mantidos exatamente como estavam, e nenhum texto usado como
accessible name pelos testes e2e (`getByRole('button', { name: '...' })`) foi removido ou alterado —
os ícones são sempre aditivos. Confirmado rodando a suíte e2e completa após o redesign.

## Como testar

```bash
pnpm dev:runes      # navegar visualmente por login, todos, users, change-password
pnpm check          # 0 erros de tipo/Svelte
pnpm test:e2e       # 10/10 — prova que nenhum data-testid/accessible name mudou
```

## Decisões de design

1. **Paleta fixada pelo tema dracula do daisyUI**, sem reinvenção — o pedido já definia a cor; o
   trabalho de design foi na tipografia, nos ícones e no elemento de assinatura.
2. **Bordas finas em vez de sombra pesada** nos cards — ajuste específico para dark UI.
3. **JetBrains Mono para "dado" vs. Manrope para "prosa"** — distinção estrutural real (o dracula é
   um tema de editor de código; usar uma mono nos pontos "de sistema" da UI é uma referência
   deliberada, não decoração).
4. **Sem animação nova** — o tema e o wordmark já carregam a personalidade da entrega; mais
   movimento arriscaria parecer efeito genérico.
5. **Ícones aditivos, nunca substituindo texto** — obrigatório para não quebrar a suíte e2e, que usa
   `getByRole` com accessible name em vários pontos.

## Links

- CHANGELOG: [../CHANGELOG.md](../CHANGELOG.md)
