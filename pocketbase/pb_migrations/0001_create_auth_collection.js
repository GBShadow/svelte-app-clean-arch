migrate((app) => {
  const collection = new Collection({
    type: "auth",
    name: "auth",
    fields: [
      { type: "text", name: "name", required: true },
      { type: "bool", name: "isAdmin" },
      { type: "bool", name: "mustChangePassword" },
      { type: "date", name: "passwordSetAt" },
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("auth")
  app.delete(collection)
})
