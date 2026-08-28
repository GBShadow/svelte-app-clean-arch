# CRUD de Categorias e Busca Agregada

Criado: 2026-08-27
Status: Em validação
Slug: 2026-08-27-crud-categorias

## Contexto

A aplicação possui múltiplos módulos de produtividade e colaboração (Itens de Afazeres/Todos, Cartões do Quadro Kanban, Tarefas do Backlog de Planning Poker, Documentos de Especificação e Cartões de Retrospectiva de Sprint). Contudo, não existe um mecanismo transversal e unificado de taxonomia.

Essa falta de categorias globais impede os usuários de:
1. Classificar e etiquetar itens de trabalho de diferentes ferramentas sob os mesmos tópicos de negócio (ex: "Frontend", "Segurança", "Infraestrutura", "Urgente").
2. Filtrar os itens pela categoria dentro da própria ferramenta de trabalho.
3. Obter uma visão transversal consolidada que agrupe todos os artefatos da aplicação associados a uma mesma categoria.

## Objetivo

Permitir a gestão completa (CRUD) de categorias globais no sistema, a associação de categorias em artefatos de trabalho (Todos, Kanban, Planning Poker, Documentos de Especificação e Retrospectivas), o filtro local por categoria em cada módulo e uma visão centralizada de busca agregada por categoria.

## Escopo

**Incluído:**
- **CRUD de Categorias Globais:** Criação, listagem, edição e exclusão de categorias acessíveis a todos os usuários autenticados (com identificador único, nome obrigatório, descrição opcional, data de criação e atualização).
- **Central de Gestão e Busca (`/categories` e `/categories/[id]`):**
  - Rota de catálogo no menu/App Hub para gerenciar categorias.
  - Página de detalhes da categoria exibindo a listagem agregada de todos os registros vinculados (Todos, Cartões Kanban, Tarefas de Poker, Documentos de Especificação e Cartões de Retrospectiva) com links de navegação direta para os itens de origem.
- **Associação de Categoria nos Módulos:**
  - Itens de Afazeres (Todos) — seleção de no máximo 1 categoria por item.
  - Cartões do Quadro Kanban — seleção de no máximo 1 categoria por cartão.
  - Tarefas de Planning Poker (Backlog global e salas) — seleção de no máximo 1 categoria por tarefa.
  - Documentos de Especificação — seleção de no máximo 1 categoria por documento.
  - Cartões de Retrospectiva de Sprint — seleção de no máximo 1 categoria por cartão.
- **Filtros Locais por Categoria:**
  - Filtro por categoria na listagem de Todos.
  - Filtro por categoria no Quadro Kanban.
  - Filtro por categoria no Backlog do Planning Poker.
  - Filtro por categoria na listagem de Documentos de Especificação.
  - Filtro por categoria no Quadro de Retrospectiva.
- **Integridade Referencial Suave (Nullify):**
  - A exclusão de uma categoria desvincula automaticamente todos os artefatos associados (definindo a categoria como nula/vazia), preservando intactos os dados de cada item.

**Fora do escopo:**
- Hierarquia de categorias (subcategorias / aninhamento em árvore).
- Múltiplas categorias simultâneas no mesmo item (sistema N:N de múltiplas tags).
- Automações baseadas em regras de transição de categoria.

## User Stories priorizadas

### US1 — Gestão Centralizada de Categorias Globais (Prioridade: P1)

**Por que esta prioridade:** Fundação obrigatória para criar e manter o catálogo de categorias antes de associá-las aos módulos.

**Teste independente:** Acessar a rota de categorias, criar uma categoria com nome e descrição, editar seus dados e excluí-la, confirmando a persistência e atualização da listagem.

**Cenários de aceite:**
1. Dado um usuário autenticado na rota de categorias, quando cria uma categoria com nome válido e descrição opcional, então a categoria é cadastrada e exibida na listagem.
2. Dado um usuário tentando criar uma categoria sem nome, quando submete o formulário, então o sistema rejeita e exibe erro de validação.
3. Dado um usuário editando nome ou descrição de uma categoria existente, quando salva, então as alterações são refletidas imediatamente.
4. Dado um usuário excluindo uma categoria, quando confirma a exclusão, então a categoria é removida.

### US2 — Busca Agregada e Visão Detalhada da Categoria (Prioridade: P2)

**Por que esta prioridade:** Entrega o valor central de visão transversal unificada entre todas as ferramentas da aplicação.

**Teste independente:** Acessar a página de detalhes de uma categoria existente que possui itens vinculados em diferentes ferramentas e verificar a exibição consolidada de Todos, Kanban Cards, Poker Tasks, Spec Docs e Retro Cards.

**Cenários de aceite:**
1. Dado que existem artefatos vinculados a uma categoria, quando o usuário acessa a página daquela categoria, então o sistema exibe seções com todos os itens associados de cada módulo com links clicáveis.
2. Dado uma categoria que não possui nenhum artefato vinculado, quando visualizada em sua página, então o sistema exibe estado vazio amigável informando a ausência de vínculos.

### US3 — Vínculo e Filtro em Itens de Afazeres (Todos) (Prioridade: P2)

**Por que esta prioridade:** Permite classificar e filtrar afazeres diários de forma rápida.

**Teste independente:** Criar/editar um item de afazer vinculando uma categoria, visualizar o badge na lista e aplicar o filtro de categoria na tela de Todos.

**Cenários de aceite:**
1. Dado o formulário de item de afazer, quando o usuário seleciona uma categoria, então o item é salvo com a categoria associada.
2. Dado a lista de afazeres com múltiplos itens, quando o usuário seleciona uma categoria no filtro da página, então apenas os itens daquela categoria são exibidos.
3. Dado um item com categoria cuja categoria é excluída, quando a lista é exibida, então o item permanece íntegro e sem categoria.

### US4 — Vínculo e Filtro em Cartões do Quadro Kanban (Prioridade: P2)

**Por que esta prioridade:** Organização visual de cartões por categoria no fluxo de trabalho ágil.

**Teste independente:** Associar uma categoria a um cartão Kanban, visualizar o rótulo no quadro e filtrar os cartões da coluna/board pela categoria selecionada.

**Cenários de aceite:**
1. Dado a criação ou edição de um cartão Kanban, quando uma categoria é selecionada, então o cartão exibe a etiqueta visual da categoria no quadro.
2. Dado o quadro Kanban, quando o usuário seleciona uma categoria na barra de filtros do quadro, então os cartões não pertencentes à categoria são ocultados.

### US5 — Vínculo e Filtro em Tarefas de Planning Poker (Prioridade: P3)

**Por que esta prioridade:** Facilita a estimativa e o planejamento de histórias e débitos agrupados por tema.

**Teste independente:** Associar categoria a uma tarefa do backlog global de poker e filtrar as tarefas por categoria na tela de backlog/sala.

**Cenários de aceite:**
1. Dado o cadastro de tarefa no backlog de poker, quando selecionada uma categoria, então a tarefa é persistida com a referência da categoria.
2. Dado o backlog de poker, quando filtrado por uma categoria, então apenas as tarefas correspondentes são listadas.

### US6 — Vínculo e Filtro em Documentos de Especificação (Prioridade: P3)

**Por que esta prioridade:** Permite classificar especificações por vertente técnica ou funcional.

**Teste independente:** Vincular categoria a um documento de especificação e filtrar a lista de documentos do projeto por categoria.

**Cenários de aceite:**
1. Dado a criação/edição de um documento de especificação, quando associada uma categoria, então a listagem de especificações exibe a categoria do documento.
2. Dado a listagem de especificações de um projeto, quando o usuário aplica o filtro de categoria, então a lista exibe apenas os documentos correspondentes.

### US7 — Vínculo e Filtro em Cartões de Retrospectiva (Prioridade: P3)

**Por que esta prioridade:** Categorização de feedbacks e itens de ação levantados em retrospectivas de sprint.

**Teste independente:** Adicionar categoria a um cartão de retrospectiva e verificar sua identificação visual no quadro de retro.

**Cenários de aceite:**
1. Dado um cartão de retrospectiva, quando o usuário associa uma categoria, então o cartão exibe o identificador visual da categoria.
2. Dado o quadro de retrospectiva, quando o usuário filtra por categoria, então os cartões são filtrados dinamicamente.

## Requisitos funcionais

- RF-001: O sistema DEVE permitir a criação de categorias com nome obrigatório (máximo 50 caracteres) e descrição opcional (máximo 250 caracteres).
- RF-002: O sistema DEVE listar todas as categorias cadastradas para usuários autenticados.
- RF-003: O sistema DEVE permitir a atualização do nome e descrição de uma categoria existente.
- RF-004: O sistema DEVE permitir a exclusão de uma categoria existente.
- RF-005: O sistema DEVE validar que o nome da categoria não contenha apenas espaços em branco e não ultrapasse o limite de caracteres.
- RF-006: O sistema DEVE fornecer uma rota dedicada `/categories` para gerenciamento do catálogo e `/categories/[id]` para visualização dos dados agregados vinculados à categoria.
- RF-007: O sistema DEVE permitir a associação de no máximo 1 categoria em itens de afazeres (Todos).
- RF-008: O sistema DEVE permitir a associação de no máximo 1 categoria em cartões do quadro Kanban.
- RF-009: O sistema DEVE permitir a associação de no máximo 1 categoria em tarefas de Planning Poker.
- RF-010: O sistema DEVE permitir a associação de no máximo 1 categoria em documentos de especificação de projetos.
- RF-011: O sistema DEVE permitir a associação de no máximo 1 categoria em cartões de retrospectiva de sprint.
- RF-012: O sistema DEVE disponibilizar filtro local por categoria nas telas de visualização de Todos, Kanban, Planning Poker, Documentos de Especificação e Retrospectivas.
- RF-013: O sistema DEVE desvincular suavemente (definir como nulo) a categoria em todos os artefatos quando a categoria correspondente for excluída, sem apagar nenhum dado dos itens associados.

## Requisitos não funcionais

- RNF-001: A interface de gerenciamento, a página de agregação e as ações de filtro devem responder em menos de 1 segundo sob condições normais de rede.
- RNF-TDD: Todo código de produção deve ser precedido pelo teste que o exige (Red-Green-Refactor). Nenhuma linha de produção é escrita sem um teste falhando primeiro (R12).
- RNF-SEG — segurança:
  - **XSS — conteúdo fornecido pelo usuário:** O nome e a descrição da categoria devem ser tratados como texto puro e devidamente escapados na renderização.
  - **IDOR / Controle de Acesso:** Apenas usuários autenticados podem visualizar e gerenciar categorias e seus vínculos.
  - **Integridade referencial:** A exclusão de uma categoria não deve deixar referências órfãs ou corromper artefatos vinculados.

## Casos de borda

- **Concorrência:** Se dois usuários editarem a mesma categoria simultaneamente, a última alteração persistida prevalece de forma consistente.
- **Dados inconsistentes:** Se uma categoria associada for excluída, todos os itens vinculados mantêm sua integridade e passam a se comportar como não categorizados.
- **Timeout / falha de rede:** O usuário recebe feedback visual claro e pode reenviar a operação sem duplicar dados.
- **Estado vazio na busca agregada:** Ao visualizar uma categoria recém-criada sem itens associados, a página exibe uma mensagem informativa amigável.
- **Estado vazio no catálogo:** Ao acessar `/categories` sem categorias cadastradas, a interface orienta a criação do primeiro registro.
- **Input malicioso:** Nomes ou descrições contendo tags HTML ou scripts são sanitizados e renderizados como texto puro.

## Critérios de aceite

- [ ] AC-001 (deriva de RF-001, RF-005): Dado um usuário autenticado, quando submete nome válido e descrição opcional, então a categoria é criada e listada globalmente.
- [ ] AC-002 (deriva de RF-002, RF-006): Dado que o usuário acessa `/categories`, quando a página carrega, então todas as categorias são exibidas com opções de edição, exclusão e visualização detalhada.
- [ ] AC-003 (deriva de RF-003): Dado que um usuário edita uma categoria, quando salva, então a atualização reflete em todas as telas e agregações.
- [ ] AC-004 (deriva de RF-004, RF-013): Dado que uma categoria com vínculos ativos é excluída, quando a ação é confirmada, então a categoria é deletada e todos os itens vinculados permanecem íntegros sem categoria.
- [ ] AC-005 (deriva de RF-006): Dado que o usuário acessa `/categories/[id]`, quando a página é carregada, então são exibidas as listas de Todos, Kanban Cards, Poker Tasks, Spec Docs e Retro Cards vinculados àquela categoria.
- [ ] AC-006 (deriva de RF-007, RF-012): Dado um item de afazer, quando associado a uma categoria, então ele exibe a categoria e pode ser filtrado na tela de Todos.
- [ ] AC-007 (deriva de RF-008, RF-012): Dado um cartão Kanban, quando associado a uma categoria, então ele exibe a categoria e pode ser filtrado no quadro Kanban.
- [ ] AC-008 (deriva de RF-009, RF-012): Dado uma tarefa de Planning Poker, quando associada a uma categoria, então ela exibe a categoria e pode ser filtrada no backlog.
- [ ] AC-009 (deriva de RF-010, RF-012): Dado um documento de especificação, quando associado a uma categoria, então ele exibe a categoria e pode ser filtrado na listagem de documentos.
- [ ] AC-010 (deriva de RF-011, RF-012): Dado um cartão de retrospectiva, quando associado a uma categoria, então ele exibe a categoria e pode ser filtrado no quadro de retrospectiva.

## Critérios de sucesso

- SC-001: Consultas de agregação de dados por categoria respondem em menos de 1 segundo.
- SC-002: 100% dos artefatos de trabalho (Todos, Kanban, Poker, Specs, Retro) mantêm integridade referencial após qualquer mutação em categorias.
- SC-003: Filtros de categoria operacionais em 100% dos módulos suportados.

## Premissas

- As categorias são de escopo global no sistema, permitindo taxonomia unificada entre times e usuários.
- Nomes de categoria devem ter no máximo 50 caracteres e descrição no máximo 250 caracteres.
- Cada item ou artefato suporta a associação com no máximo 1 categoria por vez.

## Esclarecimentos

### Sessão 2026-08-27

- Q: Como as categorias devem ser isoladas e visíveis entre os usuários e módulos? → A: Globais do Sistema (públicas para todos os usuários autenticados).
- Q: Quantas categorias podem ser vinculadas a um mesmo Todo ou Card do Kanban? → A: Categoria Única (1 por item/card).
- Q: Onde o usuário deve gerenciar o ciclo de vida das categorias? → A: Rota dedicada `/categories` no App Hub + seletores nos formulários.
- Q: O que acontece com os artefatos quando a categoria vinculada for excluída? → A: Desvinculação suave (Nullify) sem perda de dados.
- Q: Quais módulos adicionais da aplicação devem suportar categorias? → A: Planning Poker (`poker_tasks`), Documentos de Especificação (`spec_documents`) e Retrospectiva de Sprint (`retro_cards`), além de Todos e Kanban Cards.
- Q: Como deve funcionar a busca/listagem agregada de dados pela categoria? → A: Rota dedicada de detalhes agregados (`/categories/[id]`) exibindo todos os itens associados de cada módulo + filtros locais por categoria dentro de cada ferramenta.

## Riscos e dívida técnica

- **Risco:** Desempenho de consulta agregada em `/categories/[id]` ao carregar dados de 5 coleções simultâneas → **Mitigação:** Consultas paralelas no load da página indexadas por chave estrangeira `category` no banco.
- **Dívida técnica aceita:** Filtros compostos avançados (categoria + data + responsável) poderão ser otimizados em iterações posteriores.

## Links

- Plan: `docs/specs/2026-08-27-crud-categorias.plan.md`
- Tasks: `docs/specs/2026-08-27-crud-categorias.tasks.md`
- Checklist: `docs/specs/2026-08-27-crud-categorias.checklist.md`
- Jira: `docs/workflow/2026-08-27-crud-categorias.jira.md`
- Feature: `docs/features/2026-08-27-crud-categorias.md`
- PR: `docs/workflow/2026-08-27-crud-categorias.pr.md`
