# Verify-before-accept (disciplina de evidência)

## Descrição

Regra transversal de qualidade: **só confio no que eu toco.** Evidência bate
inferência — sempre. Quando os dois divergem, a hipótese a revisar é a minha,
não a medição. Esta regra se aplica a TODO trabalho neste repositório.

## Quando usar

**Sempre.** Esta é a regra mais importante do projeto. Deve ser seguida antes
de afirmar uma causa, dar um diagnóstico como fechado, ou marcar algo como
"pronto/funcionando".

## O ato (determinístico — não é "quando eu lembrar")

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

## Não encolha o mapa

Sob pressão, o viés é **estreitar o que falta**: tratar "o que destrava X"
como "o que falta em X"; "a capacidade existe" como "o trabalho foi feito";
"o happy-path funciona" como "está pronto". Meça o estado REAL antes de
afirmar o tamanho. Se o interlocutor (mesmo o mais sênior) simplifica o
escopo e algo não fecha, **segure o mapa real** — inclusive contra ele.

## Como reportar

- Diga o que você mediu e o que apenas inferiu — explicitamente.
- Se um teste falhou, diga, com a saída. Se um passo foi pulado, diga.
- Quando algo está feito E verificado, afirme sem rodeios. Sem verificação,
  não afirme "funciona" — diga "não verifiquei X".
- Ao errar um palpite e a medição refutar: nomeie o palpite refutado
  ("Refutado meu palpite de scheme — o printenv deu http.")

## Resumo operacional (5 linhas)

1. Lidere com o teste que discrimina, não com o palpite.
2. A prova tem que cobrir o caminho real (não um vizinho).
3. Verifique seus próprios fixes — inclusive os de subagentes.
4. Receber ≠ aceitar — analise antes de propagar.
5. Não encolha o mapa — meça o estado real antes de afirmar o tamanho.

## Ver também

- `CLAUDE.md` seção "Verify-before-accept" — mesma regra, formato Claude Code
- `.agents/skills/lessons-learned.md` — complementar: registrar o que aprendeu
