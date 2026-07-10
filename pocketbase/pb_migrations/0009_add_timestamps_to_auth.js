migrate((app) => {
  const collection = app.findCollectionByNameOrId("auth")

  collection.fields.add(new Field({
    type: "autodate",
    name: "created",
    onCreate: true,
  }))

  collection.fields.add(new Field({
    type: "autodate",
    name: "updated",
    onCreate: true,
    onUpdate: true,
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("auth")

  collection.fields.removeByName("created")
  collection.fields.removeByName("updated")

  return app.save(collection)
})
