migrate((app) => {
  const collection = app.findCollectionByNameOrId("auth")

  collection.fields.add(new Field({
    type: "file",
    name: "avatar",
    maxSelect: 1,
    maxSize: 2097152,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("auth")
  collection.fields.removeByName("avatar")
  return app.save(collection)
})
