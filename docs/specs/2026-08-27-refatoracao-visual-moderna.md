# Refatoração Visual Moderna da Aplicação

Criado: 2026-08-27
Status: Aprovada
Slug: 2026-08-27-refatoracao-visual-moderna

## Contexto

A interface da aplicação acumulou inconsistências visuais e padrões estéticos utilitários que resultam em uma experiência densa e pouco refinada: contrastes excessivamente rígidos, tipografia uniforme sem ritmo visual marcante, cartões e superfícies com bordas e sombras pesadas, estados vazios genéricos, feedback de interação estático e pouca hierarquia de profundidade (elevação de camadas). 

Para tornar o produto mais moderno, sofisticado e fluido no uso diário, é necessário refatorar a linguagem visual global, estabelecendo novos padrões de superfícies translúcidas/camadas sutis (glassmorphism/layering limpo), tipografia com escala harmoniosa, microinterações e transições suaves, componentes com raio de curvatura refinado, paleta de acentos com contraste calibrado para acessibilidade e densidade equilibrada entre desktop e mobile.

## Objetivo

Modernizar a identidade visual e a experiência estética de todas as telas da aplicação através de uma linguagem visual contemporânea com hierarquia de camadas clara, microinterações fluidas, tipografia expressiva e estados visuais polidos (vazio, carregamento, hover e foco).

## Escopo

**Incluído:**
- Padronização de tokens visuais fundamentais: escala tipográfica moderna, raio de bordas (border radius) harmonizado, sistema de sombras e profundidade/elevação em camadas sutis, e paleta de cores/acentos refinada.
- Modernização do Shell e Navegação Global: barra de navegação superior, menu de usuário, drawer mobile, seletores de contexto e rodapés com acabamento translúcido e transições polidas.
- Redesign dos componentes estruturais: cartões, painéis, listas, tabelas, modais, caixas de diálogo, badges, botões e controles de formulário (inputs, selects, toggles).
- Modernização das páginas centrais e ferramentas:
  - Hub de Aplicações (Dashboard inicial com cartões imersivos e status)
  - Gestão de Tarefas (Listagem de tarefas, estados de conclusão, visualização detalhada)
  - Gestão de Categorias e Visão Agregada (Catálogo moderno, badges estilizados e abas limpas)
  - Quadro de Gestão Visual de Fluxo (Colunas, cartões arrastáveis com elevação ao toque/hover, tags)
  - Salas de Estimativa em Tempo Real (Mesa de votação, cartas de estimativa estilizadas, placar e revelação)
  - Retrospectivas e Dinâmicas de Equipe (Mural de ideias, reações, votações e agrupamentos)
  - Documentos de Especificação e Visualização de Texto Rico
  - Salas de Conversação e Mensagens (Balões fluidos, avatares, feed de mensagens e área de composição)
  - Painéis de Projetos, Sprints, Notificações e Perfil de Usuário
- Estados de UI refinados: esqueletos de carregamento (skeleton loaders), ilustrações/ícones para estados vazios (empty states) e badges de status contextuais.
- Animações e microinterações elegantes para foco, hover, cliques, transições de abas e aberturas de modais (respeitando preferência de movimento reduzido).

**Fora do escopo:**
- Alterações em regras de negócio, contratos de API, schemas de banco de dados ou estrutura de dados existente.
- Remoção de identificadores de acessibilidade ou atributos de teste (`data-testid`).
- Criação de novas funcionalidades de produto não relacionadas ao design.

## User Stories priorizadas

### US1 — Tokens Visuais, Shell e Navegação Moderna (Prioridade: P1)

**Por que esta prioridade:** Estabelece a fundação visual (paleta, tipografia, elevações e acabamento da navegação superior/mobile) que envelopa e define o tom visual de todas as demais telas.

**Teste independente:** Navegar entre as páginas e observar que a barra de navegação, dropdowns de perfil, menu mobile, paleta de cores e tipografia base apresentam o novo padrão visual moderno e coeso.

**Cenários de aceite:**
1. Dado um usuário autenticado em qualquer tela, quando visualizar a barra de navegação, então deve observar uma barra com acabamento translúcido moderno, contraste legível, badge de notificações e menu de usuário refinados.
2. Dado um usuário em tela estreita (mobile), quando abrir a navegação lateral ou dropdowns, então a animação de entrada deve ser fluida e o contraste deve atender aos critérios de legibilidade.

### US2 — Modernização dos Componentes de Ação, Formulários e Modais (Prioridade: P2)

**Por que esta prioridade:** Padroniza os blocos de construção universais utilizados em todas as ferramentas da aplicação (botões, inputs, selects, badges, modais e toolbars).

**Teste independente:** Abrir qualquer formulário de criação/edição ou modal na aplicação e verificar a consistência visual dos campos, estados de foco com anel suave, botões com feedback de toque e modais com backdrop blur elegante.

**Cenários de aceite:**
1. Dado um formulário em modal, quando o usuário focar em um campo de entrada, então deve exibir um indicador de foco claro e suave sem quebra de layout.
2. Dado um botão em repouso, quando o cursor passar sobre ele (hover) ou for pressionado (active), então deve apresentar microtransição suave de elevação ou brilho/saturação.

### US3 — Redesign do Hub Inicial, Perfil, Notificações e Categorias (Prioridade: P3)

**Por que esta prioridade:** Moderniza os pontos de entrada, catálogo de ferramentas e telas de configuração/visão agregada.

**Teste independente:** Acessar o Hub, a página de Perfil, a listagem de Notificações e o catálogo de Categorias e constatar o novo layout em grid de cartões modernos com ícones vibrantes e métricas claras.

**Cenários de aceite:**
1. Dado um usuário no Hub inicial, quando visualizar os aplicativos disponíveis, então cada cartão deve exibir ícone destacado, descrição legível, efeitos de hover sutis e tags informativas.
2. Dado um usuário na visão agregada de categorias, quando alternar entre as abas de módulos vinculados, então a transição entre abas deve ser instantânea com visual limpo.

### US4 — Redesign dos Quadros de Trabalho, Salas de Colaboração e Documentos (Prioridade: P4)

**Por que esta prioridade:** Aplica a nova linguagem às ferramentas mais complexas e interativas de fluxo de trabalho (Quadro de fluxo, Salas de estimativa, Retrospectiva, Chat e Documentos).

**Teste independente:** Utilizar o quadro de fluxo e as salas em tempo real e comprovar que os cartões, colunas, cartas de votação e balões de mensagem possuem visual moderno, sem poluição visual e com excelente legibilidade.

**Cenários de aceite:**
1. Dado um quadro de trabalho com colunas, quando houver múltiplos cartões, então a hierarquia de densidade deve permitir leitura rápida com badges de categoria e prioridade elegantes.
2. Dado uma sala de estimativa ou retrospectiva, quando houver interação em tempo real, então as cartas e itens devem apresentar elevação de profundidade clara e estados de revelação polidos.

## Requisitos funcionais

- RF-001: DEVE aplicar um tema visual moderno com superfícies de camadas sutis, bordas suavizadas e sombras refinadas em todas as telas da aplicação.
- RF-002: DEVE padronizar a escala tipográfica garantindo hierarquia clara entre títulos de páginas, cabeçalhos de seção, rótulos de controle e texto de conteúdo.
- RF-003: DEVE fornecer estados de hover, foco visível e ativação com microtransições suaves em todos os elementos clicáveis (botões, links, cartões interativos).
- RF-004: DEVE manter a personalização de cor de destaque (accent color) aplicada harmoniosamente aos elementos de foco, botões primários e badges ativos.
- RF-005: DEVE apresentar estados vazios (empty states) polidos com ícone sutil, título explicativo e ação recomendada quando não houver registros.
- RF-006: DEVE apresentar esqueletos visuais (skeletons) ou indicadores de carregamento elegantes durante a obtenção de dados assíncronos.
- RF-007: DEVE preservar 100% da integridade de todos os atributos de teste e contratos de interação existentes.

## Requisitos não funcionais

- RNF-001: Contraste de texto e elementos essenciais de interface DEVE atender à conformidade WCAG 2.1 AA (mínimo de 4.5:1 para texto normal e 3:1 para texto grande/componentes de UI).
- RNF-002: Todas as transições visuais DEVEM ter duração máxima de 200ms com curva de interpolação suave (ease-out), e respeitar a mídia `prefers-reduced-motion: reduce`.
- RNF-003: A renderização visual DEVE manter estabilidade de layout (Cumulative Layout Shift - CLS < 0.1) em todos os breakpoints (375px, 768px, 1280px e superiores).
- RNF-TDD: Todo código de produção deve ser precedido pelo teste que o exige (Red-Green-Refactor). Nenhuma linha de produção é escrita sem um teste falhando primeiro (R12).
- RNF-SEG: Toda renderização de dados textuais e ricos fornecidos por usuários deve permanecer devidamente sanitizada e escapada no ponto de renderização contra XSS.

## Casos de borda

- **Preferencia de movimento reduzido:** Quando o usuário tiver `prefers-reduced-motion` ativado no sistema operacional, as animações e transições devem ser desativadas ou simplificadas instantaneamente.
- **Telas ultracompactas (375px / mobile):** Garantir que cartões, modais e barras de ferramentas adaptem seus paddings sem gerar rolagem horizontal indesejada no corpo da página.
- **Títulos ou rótulos extremamente longos:** Garantir truncamento com reticências (`truncate` / `text-ellipsis`) e quebras adequadas de linha sem transbordar os limites dos cartões.
- **Modo escuro com alto contraste:** Garantir que elementos com fundos translúcidos mantenham separação legível contra o fundo principal.
- **Múltiplos itens em foco rápido via teclado:** Garantir que o anel de foco seja visível e esteticamente integrado sem sobrepor bordas adjacentes de forma distorcida.

## Critérios de aceite

- [ ] AC-001 (deriva de RF-001): Dado um usuário navegando por qualquer rota autenticada, quando inspecionar a interface, então deve observar acabamento visual moderno e uniforme em paleta, bordas e sombras.
- [ ] AC-002 (deriva de RF-002): Dado qualquer cabeçalho de página ou seção, quando renderizado, então a proporção tipográfica deve seguir a escala de hierarquia sem colisão visual.
- [ ] AC-003 (deriva de RF-003): Dado um elemento interativo, quando o usuário interagir via mouse ou teclado, então deve exibir feedback visual suave em menos de 200ms.
- [ ] AC-004 (deriva de RF-004): Dado um usuário que alterou a cor de destaque em seu perfil, quando navegar na aplicação, então os botões principais e estados ativos devem refletir a nova cor mantendo contraste legível.
- [ ] AC-005 (deriva de RF-005): Dado um módulo sem itens cadastrados, quando acessado, então deve exibir um estado vazio estilizado com instrução clara de início.
- [ ] AC-006 (deriva de RF-007): Dado o conjunto de testes automatizados e seletores de teste, quando executados, então nenhum seletor deve ser quebrado pela refatoração visual.

## Critérios de sucesso

- SC-001: 100% das páginas autenticadas e fluxos principais convertidos para a nova linguagem visual moderna.
- SC-002: Zero regressões nos testes automatizados e suíte de testes passando integralmente.
- SC-003: Conformidade de contraste WCAG AA verificada em todos os componentes centrais.

## Premissas

- Preservação da base do tema escuro existente com elevação refinada em camadas e suporte dinâmico ao seletor de acento (accent color).
- Todas as estruturas de layout utilizam o sistema `PageShell` e utilitários responsivos já introduzidos, aprimorando seu estilo visual interno.
- Nenhuma alteração em rotas, loaders ou form actions será realizada, focando exclusivamente na camada de apresentação e componentes de UI.

## Riscos e dívida técnica

- **Risco:** Regressão visual em componentes compartilhados entre diferentes módulos → **Mitigação:** Revisão modular isolada e verificação nas diversas resoluções de tela.
- **Dívida técnica aceita:** Componentes legados não mais utilizados ou substituídos devem ser limpos ao final da implementação.

## Links

- Plan: `docs/specs/2026-08-27-refatoracao-visual-moderna.plan.md`
- Tasks: `docs/specs/2026-08-27-refatoracao-visual-moderna.tasks.md`
- Checklist: `docs/specs/2026-08-27-refatoracao-visual-moderna.checklist.md`
- Jira: `docs/workflow/2026-08-27-refatoracao-visual-moderna.jira.md`
- Feature: `docs/features/2026-08-27-refatoracao-visual-moderna.md`
- PR: `docs/workflow/2026-08-27-refatoracao-visual-moderna.pr.md`
