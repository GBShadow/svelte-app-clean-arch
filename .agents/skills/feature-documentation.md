# Documentação de Funcionalidades

## Descrição

Guia para documentar toda nova funcionalidade implementada. Deve ser usado ao **concluir** uma funcionalidade (não para bugfixes triviais de 1 linha).

## Quando usar

- O usuário concluiu uma implementação
- O usuário pediu para "documentar a feature"
- O usuário pediu para "gerar feature doc"
- O usuário pediu "CHANGELOG"
- Após uma implementação, como parte do fluxo spec-driven (passo 4)

## Passos

1. Criar `docs/features/<slug-da-feature>.md` (copiar de `docs/features/_template.md`)
2. Preencher campos: Resumo, app(s) afetado(s), camadas alteradas, fluxo Ports & Adapters, como testar, decisões de design
3. Adicionar entrada em `docs/CHANGELOG.md` no formato:
   ```
   ## [YYYY-MM-DD] <Nome da Feature>
   - App: <app> | Domínio: <pacote> | Infra: <arquivos>
   - Docs: [docs/features/<slug>.md](./features/<slug>.md)
   ```
4. Atualizar índice em `docs/features/README.md` (adicionar linha na tabela)

## Template

`docs/features/_template.md` contém:

- Resumo
- App(s) afetado(s)
- Camadas alteradas (tabela)
- Fluxo (Ports & Adapters)
- API (se houver)
- Como testar
- Decisões de design

## Convenções

- Slug em kebab-case (ex: `todo-list`, `user-profile`)
- Documentação em português (conforme `language-convention` skill)
- Sem trailer de co-autoria de IA
- Link para CHANGELOG e spec quando aplicável
