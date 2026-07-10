migrate((app) => {
  const authCollection = app.findCollectionByNameOrId("auth")

  const listsCollection = new Collection({
    type: "base",
    name: "todo_lists",
    fields: [
      { type: "text", name: "title", required: true },
      {
        type: "relation",
        name: "owner",
        required: true,
        collectionId: authCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      { type: "bool", name: "public" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "owner = @request.auth.id || public = true",
    viewRule: "owner = @request.auth.id || public = true",
    createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
    updateRule: "owner = @request.auth.id && @request.body.owner:changed = false",
    deleteRule: "owner = @request.auth.id"
  })
  app.save(listsCollection)

  const itemsCollection = new Collection({
    type: "base",
    name: "todo_items",
    fields: [
      {
        type: "relation",
        name: "list",
        required: true,
        collectionId: listsCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      { type: "text", name: "description", required: true },
      { type: "bool", name: "done" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "list.owner = @request.auth.id || list.public = true",
    viewRule: "list.owner = @request.auth.id || list.public = true",
    createRule: "list.owner = @request.auth.id",
    updateRule: "list.owner = @request.auth.id && @request.body.list:changed = false",
    deleteRule: "list.owner = @request.auth.id"
  })
  app.save(itemsCollection)
}, (app) => {
  const itemsCollection = app.findCollectionByNameOrId("todo_items")
  app.delete(itemsCollection)

  const listsCollection = app.findCollectionByNameOrId("todo_lists")
  app.delete(listsCollection)
})
