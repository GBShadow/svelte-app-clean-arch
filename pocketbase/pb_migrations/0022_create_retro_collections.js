migrate((app) => {
  const userCollection = app.findCollectionByNameOrId("user")
  const projectsCollection = app.findCollectionByNameOrId("projects")
  const sprintsCollection = app.findCollectionByNameOrId("sprints")

  const retroCollection = new Collection({
    type: "base",
    name: "retrospectives",
    fields: [
      {
        type: "relation",
        name: "project",
        required: true,
        collectionId: projectsCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      {
        type: "relation",
        name: "sprint",
        required: true,
        collectionId: sprintsCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      {
        type: "select",
        name: "status",
        required: true,
        values: ["open", "finalized"],
        maxSelect: 1
      },
      {
        type: "relation",
        name: "created_by",
        required: true,
        collectionId: userCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      { type: "date", name: "finalized_at" },
      {
        type: "relation",
        name: "finalized_by",
        required: false,
        collectionId: userCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != '' && project.participants ?= @request.auth.id",
    viewRule: "@request.auth.id != '' && project.participants ?= @request.auth.id",
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(retroCollection)

  const participantsCollection = new Collection({
    type: "base",
    name: "retrospective_participants",
    fields: [
      {
        type: "relation",
        name: "retro",
        required: true,
        collectionId: retroCollection.id,
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
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != '' && retro.project.participants ?= @request.auth.id",
    viewRule: "@request.auth.id != '' && retro.project.participants ?= @request.auth.id",
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(participantsCollection)

  const columnsCollection = new Collection({
    type: "base",
    name: "retrospective_columns",
    fields: [
      {
        type: "relation",
        name: "retro",
        required: true,
        collectionId: retroCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      { type: "text", name: "name", required: true },
      { type: "number", name: "position" },
      { type: "bool", name: "is_default" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != '' && retro.project.participants ?= @request.auth.id",
    viewRule: "@request.auth.id != '' && retro.project.participants ?= @request.auth.id",
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(columnsCollection)

  const cardsCollection = new Collection({
    type: "base",
    name: "retrospective_cards",
    fields: [
      {
        type: "relation",
        name: "retro",
        required: true,
        collectionId: retroCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      {
        type: "relation",
        name: "column",
        required: true,
        collectionId: columnsCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      { type: "text", name: "content" },
      { type: "number", name: "position" },
      { type: "text", name: "edit_token_hash" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != '' && retro.project.participants ?= @request.auth.id",
    viewRule: "@request.auth.id != '' && retro.project.participants ?= @request.auth.id",
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(cardsCollection)
}, (app) => {
  const cardsCollection = app.findCollectionByNameOrId("retrospective_cards")
  if (cardsCollection) app.delete(cardsCollection)

  const columnsCollection = app.findCollectionByNameOrId("retrospective_columns")
  if (columnsCollection) app.delete(columnsCollection)

  const participantsCollection = app.findCollectionByNameOrId("retrospective_participants")
  if (participantsCollection) app.delete(participantsCollection)

  const retroCollection = app.findCollectionByNameOrId("retrospectives")
  if (retroCollection) app.delete(retroCollection)
})
