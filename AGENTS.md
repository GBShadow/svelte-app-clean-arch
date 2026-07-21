# svelte-app-clean-arch — Guia para Antigravity

Monorepo SvelteKit com **Ports & Adapters**: app `runes` + pacote compartilhado `packages/todo-domain`.

> **Nota:** Os apps `classic` e `remote` foram movidos para `deprecated/classic` e `deprecated/remote`. Eles não fazem mais parte do workspace ativo.

## Regra principal

**Novas funcionalidades = padrão runes**.

## Verify-before-accept (disciplina de evidência) — OBRIGATÓRIA

Princípio-mestre: **só confio no que eu toco.** Evidência bate inferência —
sempre. Quando os dois divergem, a hipótese a revisar é a minha, não a medição.

### O ato (determinístico — não é "quando eu lembrar")

Antes de afirmar uma causa, dar um diagnóstico como fechado, ou marcar algo
como "pronto/funcionando":

1. **Lidere com o TESTE que discrimina, não com o palpite.** Um bom teste
   separa as hipóteses concorrentes — se o resultado não muda qual hipótese
   sobrevive, não é o teste certo. Rode-o antes de concluir.
2. **Cheque se a prova cobre o caminho REAL.** Um teste que passa por um
   caminho vizinho não prova o caminho do sistema. (Ex.: um `curl http://` na
   :80 responder NÃO prova que o app, que fala `https://` na :443, conecta.
   Provou a :80 — não a :443.)
3. **Verifique seus PRÓPRIOS fixes e o veredito de subagentes/ferramentas.**
   Um verificador pode confabular a partir de dado real (má atribuição). Um
   "guard não-pulável" pode ser ilusório. Re-teste o resultado, não defenda o
   veredito. O verify-before-accept alcança inclusive o que VOCÊ acabou de
   consertar.
4. **Receber ≠ aceitar.** Todo report, handoff, deliverable ou resposta de
   ferramenta é ANALISADO antes de ser propagado — o objetivo da análise é
   achar os pontos que FALTAM, não confirmar o que veio.

### Não encolha o mapa

Sob pressão, o viés é **estreitar o que falta**: tratar "o que destrava X"
como "o que falta em X"; "a capacidade existe" como "o trabalho foi feito";
"o happy-path funciona" como "está pronto". Meça o estado REAL antes de
afirmar o tamanho. Se o interlocutor (mesmo o mais sênior) simplifica o
escopo e algo não fecha, **segure o mapa real** — inclusive contra ele.

### Como reportar

- Diga o que você mediu e o que apenas inferiu — explicitamente.
- Se um teste falhou, diga, com a saída. Se um passo foi pulado, diga.
- Quando algo está feito E verificado, afirme sem rodeios. Sem verificação,
  não afirme "funciona" — diga "não verifiquei X".
- Ao errar um palpite e a medição refutar: nomeie o palpite refutado
  ("Refutado meu palpite de scheme — o printenv deu http.")

## Débito técnico — OBRIGATÓRIA

Sempre que você identificar, durante uma spec, code review, implementação ou investigação, um
débito técnico real (bug latente, simplificação arriscada, gap de segurança não bloqueante,
inconsistência entre spec e código, teste faltando, dependência desatualizada) que **não vai
corrigir agora** — registre em [`docs/TECH-DEBT.md`](./docs/TECH-DEBT.md) antes de seguir em
frente. Não é o mesmo que `lessons-learned`/`tech-debt` para problema já corrigido — é
especificamente para o que ficou pendente. Siga o formato já descrito no próprio arquivo. Ao
resolver um item já listado, mova-o para "Resolvidos" com data e PR/commit. Ver
`.agents/skills/tech-debt.md` para o detalhamento completo da regra.

## Leitura prioritária e Segurança

**Antes de iniciar qualquer tarefa ou especificação**, você DEVE OBRIGATORIAMENTE:

1. Ler `docs/CODE-STRUCTURE.md` para entender a estrutura atual do projeto e a arquitetura real.
2. Analisar todos os impactos de segurança do que será desenvolvido (ex: XSS em campos de texto rico, vazamento de dados via PocketBase realtime subscriptions e IDOR).
3. Nunca ignorar as regras do banco de dados (ler regras em `.agents/skills/pocketbase-*.md` antes de desenhar entidades do PocketBase).

## Idioma

Código (variáveis, funções, comentários, nomes de tabelas/colunas no banco) em **inglês**. Texto voltado ao usuário — UI e mensagens de erro/validação retornadas ao usuário — em **português**. Documentação (specs, PR, Jira, features, CHANGELOG) em português.

## Commits e PRs

Sem trailer de co-autoria (`Co-Authored-By: Claude ...`) em commits ou PRs deste repositório.

## Comandos disponíveis

- `review` — revisão completa de código: análise técnica, lint/typecheck, testes,
  documentação (CODE-STRUCTURE, CHANGELOG, features, tech-debt), lições aprendidas e
  análise de impacto. Aceita commit, branch, PR ou nada (mudanças não commitadas).
  Definição em `.opencode/command/review.md`.

## Skills disponíveis (`.agents/skills/`)

- `verify-before-accept` — disciplina de evidência (esta regra — detalhada acima)
- `runes-ports-adapters` — guia de implementação runes
- `classic-ports-adapters` — guia de implementação classic (deprecated)
- `feature-documentation` — documentação de funcionalidades
- `language-convention` — convenção de idioma
- `code-structure` — ler CODE-STRUCTURE.md antes; atualizar docs depois
- `data-testid` — adicionar data-testid em componentes + usar getByTestId
- `pocketbase-collections` — toda coleção PocketBase precisa dos campos `created`/`updated`
- `pocketbase-api-rules` — API Rules de update/delete devem restringir campos
- `lessons-learned` — todo problema não trivial resolvido deve ser registrado
- `tech-debt` — débito técnico identificado e não corrigido na hora deve ser registrado em `docs/TECH-DEBT.md`
- `checkpoint` — salva estado da sessão para retomar depois em nova sessão
- `spec-driven` — agente de processo spec-driven
