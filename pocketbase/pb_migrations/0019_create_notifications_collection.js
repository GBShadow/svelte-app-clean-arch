migrate((app) => {
  const authCollection = app.findCollectionByNameOrId("auth")

  const notificationsCollection = new Collection({
    type: "base",
    name: "notifications",
    fields: [
      {
        type: "relation",
        name: "user",
        required: true,
        collectionId: authCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      {
        type: "select",
        name: "type",
        required: true,
        values: ["chat", "system", "kanban", "poker"]
      },
      { type: "text", name: "title", required: true, max: 200 },
      { type: "text", name: "body", required: true, max: 1000 },
      { type: "text", name: "url" },
      { type: "bool", name: "read", required: true, default: false },
      { type: "json", name: "metadata" },
      { type: "date", name: "expiresAt" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    indexes: [
      "CREATE INDEX idx_notifications_user_created ON notifications (user, created DESC)",
      "CREATE INDEX idx_notifications_user_read ON notifications (user, read)"
    ],
    listRule: "user = @request.auth.id",
    viewRule: "user = @request.auth.id",
    createRule: "@request.auth.id != '' && @request.body.user = @request.auth.id",
    updateRule: null,
    deleteRule: "user = @request.auth.id"
  })
  app.save(notificationsCollection)
}, (app) => {
  const notificationsCollection = app.findCollectionByNameOrId("notifications")
  app.delete(notificationsCollection)
})