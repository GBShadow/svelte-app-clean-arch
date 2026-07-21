migrate((app) => {
  // PocketBase trata `false` como "vazio" na validação de campo bool required:true,
  // então toda tentativa de criar uma notificação (sempre com read=false) falhava
  // com "read: Cannot be blank." — o default já garante o valor, required é redundante e quebra a criação.
  const collection = app.findCollectionByNameOrId("notifications")
  const field = collection.fields.getByName("read")
  field.required = false
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("notifications")
  const field = collection.fields.getByName("read")
  field.required = true
  return app.save(collection)
})
