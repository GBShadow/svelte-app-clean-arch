migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "user",
    fields: [
      { type: "text", name: "name", required: true },
      { type: "email", name: "email", required: true },
      {
        type: "select",
        name: "jobTitle",
        values: ["senior", "mid", "junior", "intern"],
        maxSelect: 1,
      },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_user_email ON user (email)"],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("user")
  app.delete(collection)
})
