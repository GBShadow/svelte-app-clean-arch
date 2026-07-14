migrate((app) => {
  const roomsCollection = app.findCollectionByNameOrId("poker_rooms")
  const tasksCollection = app.findCollectionByNameOrId("poker_tasks")

  // 1. Em poker_rooms, adicionar o campo status (select ['open', 'finalized'], default 'open', required)
  roomsCollection.fields.add(new Field({
    type: "select",
    name: "status",
    required: true,
    values: ["open", "finalized"],
    maxSelect: 1
  }))
  app.save(roomsCollection)

  // 2. Em poker_tasks, alterar a relação room para ser opcional
  const roomField = tasksCollection.fields.getByName("room")
  if (roomField) {
    roomField.required = false
  }

  // 3. Em poker_tasks, adicionar o campo is_global_backlog (bool, default false)
  tasksCollection.fields.add(new Field({
    type: "bool",
    name: "is_global_backlog"
  }))

  // 4. API Rules de poker_tasks: atualizar listRule e viewRule
  tasksCollection.listRule = "@request.auth.id != '' && ((is_global_backlog = true && room = '') || (room != '' && room.poker_participants_via_room.user.email = @request.auth.email && room.poker_participants_via_room.has_left = false))"
  tasksCollection.viewRule = "@request.auth.id != '' && ((is_global_backlog = true && room = '') || (room != '' && room.poker_participants_via_room.user.email = @request.auth.email && room.poker_participants_via_room.has_left = false))"
  app.save(tasksCollection)

  // Para garantir que todas as salas existentes tenham o status inicial como 'open'
  try {
    app.db().newQuery("UPDATE poker_rooms SET status = 'open' WHERE status = '' OR status IS NULL").execute()
  } catch (e) {
    // ignorar se falhar
  }

}, (app) => {
  const roomsCollection = app.findCollectionByNameOrId("poker_rooms")
  const tasksCollection = app.findCollectionByNameOrId("poker_tasks")

  // Rollback 1. Remover status em poker_rooms
  roomsCollection.fields.removeByName("status")
  app.save(roomsCollection)

  // Rollback 2. Restaurar room para required = true em poker_tasks
  const roomField = tasksCollection.fields.getByName("room")
  if (roomField) {
    roomField.required = true
  }

  // Rollback 3. Remover is_global_backlog em poker_tasks
  tasksCollection.fields.removeByName("is_global_backlog")

  // Rollback 4. Restaurar listRule e viewRule antigas
  tasksCollection.listRule = "@request.auth.id != '' && room.poker_participants_via_room.user.email = @request.auth.email && room.poker_participants_via_room.has_left = false"
  tasksCollection.viewRule = "@request.auth.id != '' && room.poker_participants_via_room.user.email = @request.auth.email && room.poker_participants_via_room.has_left = false"
  app.save(tasksCollection)
})
