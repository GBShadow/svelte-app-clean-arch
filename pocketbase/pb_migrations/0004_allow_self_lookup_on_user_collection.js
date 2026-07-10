migrate((app) => {
  const collection = app.findCollectionByNameOrId("user")

  const selfLookupRule = "@request.auth.id != '' && email = @request.auth.email"
  collection.listRule = selfLookupRule
  collection.viewRule = selfLookupRule

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("user")

  collection.listRule = null
  collection.viewRule = null

  app.save(collection)
})
