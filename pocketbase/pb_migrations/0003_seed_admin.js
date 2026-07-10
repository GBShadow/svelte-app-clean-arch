migrate((app) => {
  const email = $os.getenv("SEED_ADMIN_EMAIL")
  const password = $os.getenv("SEED_ADMIN_PASSWORD")

  const authCollection = app.findCollectionByNameOrId("auth")
  const authRecord = new Record(authCollection)
  authRecord.set("email", email)
  authRecord.set("password", password)
  authRecord.set("name", "Admin")
  authRecord.set("isAdmin", true)
  app.save(authRecord)

  const userCollection = app.findCollectionByNameOrId("user")
  const userRecord = new Record(userCollection)
  userRecord.set("name", "Admin")
  userRecord.set("email", email)
  app.save(userRecord)
}, (app) => {
  const email = $os.getenv("SEED_ADMIN_EMAIL")

  try {
    const authRecord = app.findAuthRecordByEmail("auth", email)
    app.delete(authRecord)
  } catch {
    // já removido
  }

  try {
    const userRecord = app.findFirstRecordByFilter("user", "email = {:email}", { email: email })
    app.delete(userRecord)
  } catch {
    // já removido
  }
})
