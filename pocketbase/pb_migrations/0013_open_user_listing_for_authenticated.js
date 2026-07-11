migrate((app) => {
  const collection = app.findCollectionByNameOrId("user")
  collection.listRule = "@request.auth.id != ''"
  collection.viewRule = "@request.auth.id != ''"
  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("user")
  const userSelfOrAdmin = "@request.auth.isAdmin = true || email = @request.auth.email"
  collection.listRule = userSelfOrAdmin
  collection.viewRule = userSelfOrAdmin
  app.save(collection)
})
