migrate((app) => {
  const authCollection = app.findCollectionByNameOrId("auth")

  const pushSubscriptionsCollection = new Collection({
    type: "base",
    name: "push_subscriptions",
    fields: [
      {
        type: "relation",
        name: "user",
        required: true,
        collectionId: authCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      { type: "text", name: "endpoint", required: true },
      { type: "text", name: "p256dh", required: true },
      { type: "text", name: "auth_key", required: true },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_push_subscriptions_endpoint ON push_subscriptions (endpoint)"
    ],
    listRule: "user = @request.auth.id",
    viewRule: "user = @request.auth.id",
    createRule: "@request.auth.id != '' && @request.body.user = @request.auth.id",
    updateRule: null,
    deleteRule: "user = @request.auth.id"
  })
  app.save(pushSubscriptionsCollection)
}, (app) => {
  const pushSubscriptionsCollection = app.findCollectionByNameOrId("push_subscriptions")
  app.delete(pushSubscriptionsCollection)
})
