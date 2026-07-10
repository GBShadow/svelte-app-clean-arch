migrate((app) => {
  const authCollection = app.findCollectionByNameOrId("auth")
  authCollection.updateRule =
    "@request.auth.isAdmin = true || (" +
    "id = @request.auth.id && " +
    "@request.body.isAdmin:changed = false && " +
    "@request.body.email:changed = false && " +
    "(@request.body.mustChangePassword:changed = false || @request.body.password:isset = true) && " +
    "(@request.body.passwordSetAt:changed = false || @request.body.password:isset = true)" +
    ")"
  app.save(authCollection)

  const userCollection = app.findCollectionByNameOrId("user")
  userCollection.updateRule =
    "@request.auth.isAdmin = true || (" +
    "email = @request.auth.email && " +
    "@request.body.email:changed = false" +
    ")"
  app.save(userCollection)
}, (app) => {
  const authCollection = app.findCollectionByNameOrId("auth")
  authCollection.updateRule = "@request.auth.isAdmin = true || id = @request.auth.id"
  app.save(authCollection)

  const userCollection = app.findCollectionByNameOrId("user")
  userCollection.updateRule = "@request.auth.isAdmin = true || email = @request.auth.email"
  app.save(userCollection)
})
