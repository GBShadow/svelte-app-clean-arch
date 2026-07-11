migrate((app) => {
  const collection = app.findCollectionByNameOrId("chat_rooms")
  collection.updateRule = "created_by = @request.auth.id"
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("chat_rooms")
  collection.updateRule = "created_by = @request.auth.id || participants.id ?= @request.auth.id"
  return app.save(collection)
})
