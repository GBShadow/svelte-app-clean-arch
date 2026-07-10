# Convenção de Idioma

## Descrição

Define quando usar inglês vs. português neste projeto. Aplique sempre a todas as interações e modificações no código.

## Quando usar

Sempre ativo (`alwaysApply`) — aplica-se a qualquer modificação no código, documentação, UI ou mensagens.

## Regras

### Inglês (código e estrutura técnica)

- Variáveis, funções, classes, tipos, interfaces
- Nomes de arquivos e pastas
- Comentários no código
- Nomes de tabelas/collections e colunas/campos no banco (ex.: PocketBase)
- Mensagens de commit, nomes de branch

### Português (voltado ao usuário)

- Textos de UI (labels, botões, títulos, placeholders)
- Mensagens de erro e validação retornadas por form actions/APIs
- Documentação (specs, PR, Jira, features, CHANGELOG)

## Exemplo

```ts
// código em inglês
export async function createUser(input: CreateUserInput) {
  if (!input.email) {
    // mensagem exibida ao usuário: português
    return fail(400, { error: 'O e-mail é obrigatório.' });
  }
}
```

```js
// nomes de coleção/campo em inglês
collection.name = 'user';
collection.fields = [{ name: 'jobTitle', type: 'select' }];
```
