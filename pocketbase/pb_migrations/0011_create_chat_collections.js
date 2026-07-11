migrate((app) => {
  const authCollection = app.findCollectionByNameOrId("auth")

  const roomsCollection = new Collection({
    type: "base",
    name: "chat_rooms",
    fields: [
      { type: "text", name: "name" },
      {
        type: "relation",
        name: "created_by",
        required: true,
        collectionId: authCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      {
        type: "relation",
        name: "participants",
        required: true,
        collectionId: authCollection.id,
        maxSelect: 999,
        cascadeDelete: false
      },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "participants.id ?= @request.auth.id",
    viewRule: "participants.id ?= @request.auth.id",
    createRule: "@request.auth.id != '' && @request.body.created_by = @request.auth.id",
    updateRule: "created_by = @request.auth.id || participants.id ?= @request.auth.id",
    deleteRule: "created_by = @request.auth.id"
  })
  app.save(roomsCollection)

  const messagesCollection = new Collection({
    type: "base",
    name: "chat_messages",
    fields: [
      {
        type: "relation",
        name: "room",
        required: true,
        collectionId: roomsCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      {
        type: "relation",
        name: "sender",
        required: true,
        collectionId: authCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      { type: "text", name: "text", required: true, max: 2000 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "room.participants.id ?= @request.auth.id",
    viewRule: "room.participants.id ?= @request.auth.id",
    createRule: "room.participants.id ?= @request.auth.id && @request.body.sender = @request.auth.id",
    updateRule: null,
    deleteRule: null
  })
  app.save(messagesCollection)
}, (app) => {
  const messagesCollection = app.findCollectionByNameOrId("chat_messages")
  app.delete(messagesCollection)

  const roomsCollection = app.findCollectionByNameOrId("chat_rooms")
  app.delete(roomsCollection)
})
