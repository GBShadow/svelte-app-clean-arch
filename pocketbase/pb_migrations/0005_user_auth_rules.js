migrate((app) => {
  const userCollection = app.findCollectionByNameOrId("user")
  const userSelfOrAdmin = "@request.auth.isAdmin = true || email = @request.auth.email"
  userCollection.listRule = userSelfOrAdmin
  userCollection.viewRule = userSelfOrAdmin
  userCollection.updateRule = userSelfOrAdmin
  userCollection.createRule = "@request.auth.isAdmin = true"
  userCollection.deleteRule = "@request.auth.isAdmin = true"
  app.save(userCollection)

  const authCollection = app.findCollectionByNameOrId("auth")
  const authSelfOrAdmin = "@request.auth.isAdmin = true || id = @request.auth.id"
  authCollection.listRule = authSelfOrAdmin
  authCollection.viewRule = authSelfOrAdmin
  authCollection.updateRule = authSelfOrAdmin
  authCollection.manageRule = "@request.auth.isAdmin = true"
  authCollection.createRule = "@request.auth.isAdmin = true"
  authCollection.deleteRule = "@request.auth.isAdmin = true"
  app.save(authCollection)
}, (app) => {
  const userCollection = app.findCollectionByNameOrId("user")
  const selfLookupRule = "@request.auth.id != '' && email = @request.auth.email"
  userCollection.listRule = selfLookupRule
  userCollection.viewRule = selfLookupRule
  userCollection.updateRule = null
  userCollection.createRule = null
  userCollection.deleteRule = null
  app.save(userCollection)

  const authCollection = app.findCollectionByNameOrId("auth")
  authCollection.listRule = null
  authCollection.viewRule = null
  authCollection.updateRule = null
  authCollection.manageRule = null
  authCollection.createRule = null
  authCollection.deleteRule = null
  app.save(authCollection)
})
