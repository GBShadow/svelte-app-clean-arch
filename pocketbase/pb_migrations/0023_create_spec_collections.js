migrate((app) => {
  const userCollection = app.findCollectionByNameOrId("user")
  const projectsCollection = app.findCollectionByNameOrId("projects")

  const docsCollection = new Collection({
    type: "base",
    name: "spec_documents",
    fields: [
      {
        type: "relation",
        name: "project",
        required: true,
        collectionId: projectsCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      { type: "text", name: "title", required: true },
      { type: "text", name: "body_md" },
      {
        type: "relation",
        name: "created_by",
        required: true,
        collectionId: userCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      { type: "bool", name: "is_public_link" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(docsCollection)

  const tagsCollection = new Collection({
    type: "base",
    name: "spec_tags",
    fields: [
      {
        type: "relation",
        name: "document",
        required: true,
        collectionId: docsCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      { type: "text", name: "tag", required: true },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(tagsCollection)

  const permissionsCollection = new Collection({
    type: "base",
    name: "spec_document_permissions",
    fields: [
      {
        type: "relation",
        name: "document",
        required: true,
        collectionId: docsCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      {
        type: "relation",
        name: "user",
        required: true,
        collectionId: userCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      {
        type: "select",
        name: "role",
        required: true,
        values: ["view", "edit"],
        maxSelect: 1
      },
      { type: "text", name: "pair", required: true, unique: true },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "document.created_by.id = @request.auth.id",
    viewRule: "document.created_by.id = @request.auth.id",
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(permissionsCollection)

  // Add source_spec to poker_tasks
  const pokerTasksCollection = app.findCollectionByNameOrId("poker_tasks")
  if (pokerTasksCollection && !pokerTasksCollection.fields.find(function(f) { return f.name === "source_spec" })) {
    pokerTasksCollection.fields.add(new RelationField({
      name: "source_spec",
      required: false,
      collectionId: docsCollection.id,
      maxSelect: 1,
      cascadeDelete: false
    }))
    app.save(pokerTasksCollection)
  }

  // Add source_spec to kanban_cards
  const kanbanCardsCollection = app.findCollectionByNameOrId("kanban_cards")
  if (kanbanCardsCollection && !kanbanCardsCollection.fields.find(function(f) { return f.name === "source_spec" })) {
    kanbanCardsCollection.fields.add(new RelationField({
      name: "source_spec",
      required: false,
      collectionId: docsCollection.id,
      maxSelect: 1,
      cascadeDelete: false
    }))
    app.save(kanbanCardsCollection)
  }
}, (app) => {
  const permissionsCollection = app.findCollectionByNameOrId("spec_document_permissions")
  if (permissionsCollection) app.delete(permissionsCollection)

  const tagsCollection = app.findCollectionByNameOrId("spec_tags")
  if (tagsCollection) app.delete(tagsCollection)

  const docsCollection = app.findCollectionByNameOrId("spec_documents")
  if (docsCollection) app.delete(docsCollection)

  // Remove source_spec from poker_tasks
  const pokerTasksCollection = app.findCollectionByNameOrId("poker_tasks")
  if (pokerTasksCollection) {
    const field = pokerTasksCollection.fields.find(function(f) { return f.name === "source_spec" })
    if (field) {
      pokerTasksCollection.fields.remove(field)
      app.save(pokerTasksCollection)
    }
  }

  // Remove source_spec from kanban_cards
  const kanbanCardsCollection = app.findCollectionByNameOrId("kanban_cards")
  if (kanbanCardsCollection) {
    const field = kanbanCardsCollection.fields.find(function(f) { return f.name === "source_spec" })
    if (field) {
      kanbanCardsCollection.fields.remove(field)
      app.save(kanbanCardsCollection)
    }
  }
})
