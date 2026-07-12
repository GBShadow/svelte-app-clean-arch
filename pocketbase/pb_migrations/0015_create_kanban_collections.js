migrate((app) => {
  const authCollection = app.findCollectionByNameOrId("auth")
  const userCollection = app.findCollectionByNameOrId("user")

  const columnsCollection = new Collection({
    type: "base",
    name: "kanban_columns",
    fields: [
      { type: "text", name: "name", required: true },
      { type: "number", name: "position" }, // Removido required: true pois 0 falha na validação do PocketBase
      {
        type: "select",
        name: "type",
        required: true,
        values: ["backlog", "done", "custom"],
        maxSelect: 1
      },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(columnsCollection)

  // Seed the standard columns
  const col1 = new Record(columnsCollection)
  col1.set("name", "Aguardando")
  col1.set("position", 0)
  col1.set("type", "backlog")
  app.save(col1)

  const col2 = new Record(columnsCollection)
  col2.set("name", "Fazendo")
  col2.set("position", 1)
  col2.set("type", "custom")
  app.save(col2)

  const col3 = new Record(columnsCollection)
  col3.set("name", "Feito")
  col3.set("position", 2)
  col3.set("type", "done")
  app.save(col3)

  const cardsCollection = new Collection({
    type: "base",
    name: "kanban_cards",
    fields: [
      { type: "text", name: "title", required: true },
      { type: "text", name: "description" },
      {
        type: "relation",
        name: "column",
        required: true,
        collectionId: columnsCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      {
        type: "relation",
        name: "created_by",
        required: true,
        collectionId: userCollection.id, // Aponta para a coleção user (perfil público)
        maxSelect: 1,
        cascadeDelete: false
      },
      {
        type: "relation",
        name: "assignees",
        required: false,
        collectionId: userCollection.id, // Aponta para a coleção user (perfil público)
        maxSelect: 999,
        cascadeDelete: false
      },
      { type: "number", name: "position" }, // Removido required: true pois 0 falha na validação do PocketBase
      { type: "number", name: "points" },
      { type: "json", name: "tags" },
      { type: "date", name: "dueDate" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(cardsCollection)

  const commentsCollection = new Collection({
    type: "base",
    name: "kanban_card_comments",
    fields: [
      {
        type: "relation",
        name: "card",
        required: true,
        collectionId: cardsCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      {
        type: "relation",
        name: "user",
        required: true,
        collectionId: userCollection.id, // Aponta para a coleção user (perfil público)
        maxSelect: 1,
        cascadeDelete: false
      },
      { type: "text", name: "text", required: true, max: 2000 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && user.email = @request.auth.email",
    updateRule: "user.email = @request.auth.email && @request.body.user:changed = false && @request.body.card:changed = false",
    deleteRule: "user.email = @request.auth.email"
  })
  app.save(commentsCollection)

  const historyCollection = new Collection({
    type: "base",
    name: "kanban_card_history",
    fields: [
      {
        type: "relation",
        name: "card",
        required: true,
        collectionId: cardsCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      {
        type: "relation",
        name: "user",
        required: true,
        collectionId: userCollection.id, // Aponta para a coleção user (perfil público)
        maxSelect: 1,
        cascadeDelete: false
      },
      { type: "text", name: "field", required: true },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(historyCollection)
}, (app) => {
  const historyCollection = app.findCollectionByNameOrId("kanban_card_history")
  if (historyCollection) app.delete(historyCollection)

  const commentsCollection = app.findCollectionByNameOrId("kanban_card_comments")
  if (commentsCollection) app.delete(commentsCollection)

  const cardsCollection = app.findCollectionByNameOrId("kanban_cards")
  if (cardsCollection) app.delete(cardsCollection)

  const columnsCollection = app.findCollectionByNameOrId("kanban_columns")
  if (columnsCollection) app.delete(columnsCollection)
})
