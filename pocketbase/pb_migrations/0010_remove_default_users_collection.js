migrate((app) => {
  const collection = app.findCollectionByNameOrId("users")
  app.delete(collection)
}, (app) => {
  // Coleção "users" era a auth collection padrão de fábrica do PocketBase,
  // nunca usada por este projeto (que usa "auth" como coleção de autenticação).
  // Não há recriação automática no rollback; se necessário, recrie manualmente
  // pelo painel admin (Nova coleção > tipo auth > nome "users").
})
