migrate((app) => {
  const userCollection = app.findCollectionByNameOrId("user")
  const cardsCollection = app.findCollectionByNameOrId("kanban_cards")

  // 1. Criar poker_rooms (current_task como campo text para evitar circularidade)
  const roomsCollection = new Collection({
    type: "base",
    name: "poker_rooms",
    fields: [
      { type: "text", name: "name", required: true },
      {
        type: "relation",
        name: "created_by",
        required: true,
        collectionId: userCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      { type: "text", name: "current_task" }, // Campo text simples para quebrar circularidade
      { type: "bool", name: "revealed" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(roomsCollection)

  // 2. Criar poker_tasks
  const tasksCollection = new Collection({
    type: "base",
    name: "poker_tasks",
    fields: [
      {
        type: "relation",
        name: "room",
        required: true,
        collectionId: roomsCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      { type: "text", name: "title", required: true },
      { type: "text", name: "description" },
      { type: "number", name: "final_points" },
      {
        type: "select",
        name: "status",
        required: true,
        values: ["backlog", "voting", "estimated", "exported"],
        maxSelect: 1
      },
      {
        type: "relation",
        name: "exported_card",
        collectionId: cardsCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(tasksCollection)

  // 3. Criar poker_participants
  const participantsCollection = new Collection({
    type: "base",
    name: "poker_participants",
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
        name: "user",
        required: true,
        collectionId: userCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      {
        type: "select",
        name: "role",
        required: true,
        values: ["admin", "voter", "spectator"],
        maxSelect: 1
      },
      { type: "bool", name: "is_online" },
      { type: "bool", name: "has_voted" },
      { type: "bool", name: "has_left" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(participantsCollection)

  // 4. Criar poker_votes
  const votesCollection = new Collection({
    type: "base",
    name: "poker_votes",
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
        name: "task",
        required: true,
        collectionId: tasksCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      {
        type: "relation",
        name: "user",
        required: true,
        collectionId: userCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      { type: "text", name: "value", required: true },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null
  })
  app.save(votesCollection)

  // 5. Configurar e salvar as API Rules agora que todas as coleções foram criadas com sucesso
  roomsCollection.listRule = "@request.auth.id != '' && poker_participants_via_room.user.email = @request.auth.email && poker_participants_via_room.has_left = false"
  roomsCollection.viewRule = "@request.auth.id != '' && poker_participants_via_room.user.email = @request.auth.email && poker_participants_via_room.has_left = false"
  roomsCollection.createRule = "@request.auth.id != '' && created_by.email = @request.auth.email"
  app.save(roomsCollection)

  tasksCollection.listRule = "@request.auth.id != '' && room.poker_participants_via_room.user.email = @request.auth.email && room.poker_participants_via_room.has_left = false"
  tasksCollection.viewRule = "@request.auth.id != '' && room.poker_participants_via_room.user.email = @request.auth.email && room.poker_participants_via_room.has_left = false"
  app.save(tasksCollection)

  participantsCollection.listRule = "@request.auth.id != '' && room.poker_participants_via_room.user.email = @request.auth.email && room.poker_participants_via_room.has_left = false"
  participantsCollection.viewRule = "@request.auth.id != '' && room.poker_participants_via_room.user.email = @request.auth.email && room.poker_participants_via_room.has_left = false"
  participantsCollection.createRule = "@request.auth.id != '' && user.email = @request.auth.email && role = 'voter' && has_voted = false && has_left = false"
  participantsCollection.updateRule = "user.email = @request.auth.email && @request.body.room:changed = false && @request.body.user:changed = false && @request.body.role:changed = false && @request.body.has_voted:changed = false && @request.body.has_left:changed = false"
  app.save(participantsCollection)

  votesCollection.listRule = "@request.auth.id != '' && room.poker_participants_via_room.user.email = @request.auth.email && room.poker_participants_via_room.has_left = false && (user.email = @request.auth.email || room.revealed = true)"
  votesCollection.viewRule = "@request.auth.id != '' && room.poker_participants_via_room.user.email = @request.auth.email && room.poker_participants_via_room.has_left = false && (user.email = @request.auth.email || room.revealed = true)"
  app.save(votesCollection)

}, (app) => {
  const votesCollection = app.findCollectionByNameOrId("poker_votes")
  if (votesCollection) app.delete(votesCollection)

  const participantsCollection = app.findCollectionByNameOrId("poker_participants")
  if (participantsCollection) app.delete(participantsCollection)

  const tasksCollection = app.findCollectionByNameOrId("poker_tasks")
  if (tasksCollection) app.delete(tasksCollection)

  const roomsCollection = app.findCollectionByNameOrId("poker_rooms")
  if (roomsCollection) app.delete(roomsCollection)
})
