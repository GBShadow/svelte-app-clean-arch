migrate((app) => {
  // 1. Criar coleção categories
  const categoriesCollection = new Collection({
    type: "base",
    name: "categories",
    fields: [
      { type: "text", name: "name", required: true },
      { type: "text", name: "description" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });
  app.save(categoriesCollection);

  // 2. Adicionar campo category em todo_items
  try {
    const todoItems = app.findCollectionByNameOrId("todo_items");
    if (todoItems && !todoItems.fields.find((f) => f.name === "category")) {
      todoItems.fields.add(new RelationField({
        name: "category",
        required: false,
        collectionId: categoriesCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      }));
      app.save(todoItems);
    }
  } catch (e) {}

  // 3. Adicionar campo category em kanban_cards
  try {
    const kanbanCards = app.findCollectionByNameOrId("kanban_cards");
    if (kanbanCards && !kanbanCards.fields.find((f) => f.name === "category")) {
      kanbanCards.fields.add(new RelationField({
        name: "category",
        required: false,
        collectionId: categoriesCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      }));
      app.save(kanbanCards);
    }
  } catch (e) {}

  // 4. Adicionar campo category em poker_tasks
  try {
    const pokerTasks = app.findCollectionByNameOrId("poker_tasks");
    if (pokerTasks && !pokerTasks.fields.find((f) => f.name === "category")) {
      pokerTasks.fields.add(new RelationField({
        name: "category",
        required: false,
        collectionId: categoriesCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      }));
      app.save(pokerTasks);
    }
  } catch (e) {}

  // 5. Adicionar campo category em spec_documents
  try {
    const specDocs = app.findCollectionByNameOrId("spec_documents");
    if (specDocs && !specDocs.fields.find((f) => f.name === "category")) {
      specDocs.fields.add(new RelationField({
        name: "category",
        required: false,
        collectionId: categoriesCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      }));
      app.save(specDocs);
    }
  } catch (e) {}

  // 6. Adicionar campo category em retro_cards
  try {
    const retroCards = app.findCollectionByNameOrId("retro_cards");
    if (retroCards && !retroCards.fields.find((f) => f.name === "category")) {
      retroCards.fields.add(new RelationField({
        name: "category",
        required: false,
        collectionId: categoriesCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      }));
      app.save(retroCards);
    }
  } catch (e) {}

}, (app) => {
  // Rollback: remover campos e deletar coleção categories
  const collectionsWithCategory = ["todo_items", "kanban_cards", "poker_tasks", "spec_documents", "retro_cards"];
  for (const name of collectionsWithCategory) {
    try {
      const col = app.findCollectionByNameOrId(name);
      if (col && col.fields.find((f) => f.name === "category")) {
        col.fields.removeByName("category");
        app.save(col);
      }
    } catch (e) {}
  }

  try {
    const categories = app.findCollectionByNameOrId("categories");
    if (categories) {
      app.delete(categories);
    }
  } catch (e) {}
});
