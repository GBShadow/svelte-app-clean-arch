migrate((app) => {
  const authCollection = app.findCollectionByNameOrId("auth")
  const userCollection = app.findCollectionByNameOrId("user")

  // ── 1. projects ──────────────────────────────────────────────
  const projectsCollection = new Collection({
    type: "base",
    name: "projects",
    fields: [
      { type: "text", name: "title", required: true, max: 200 },
      { type: "text", name: "description", required: true, max: 5000 },
      { type: "file", name: "image", maxSize: 2097152, mimeTypes: ["image/png", "image/jpeg", "image/webp"], maxSelect: 1 },
      {
        type: "relation",
        name: "created_by",
        required: true,
        collectionId: userCollection.id,
        maxSelect: 1,
        cascadeDelete: false
      },
      {
        type: "relation",
        name: "responsaveis",
        required: false,
        collectionId: userCollection.id,
        maxSelect: 999,
        cascadeDelete: false
      },
      {
        type: "relation",
        name: "participants",
        required: false,
        collectionId: userCollection.id,
        maxSelect: 999,
        cascadeDelete: false
      },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != '' && (participants ?= @request.auth.id || @request.auth.isAdmin = true)",
    viewRule: "@request.auth.id != '' && (participants ?= @request.auth.id || @request.auth.isAdmin = true)",
    createRule: "@request.auth.isAdmin = true",
    updateRule: "@request.auth.isAdmin = true || responsaveis ?= @request.auth.id",
    deleteRule: "created_by = @request.auth.id || @request.auth.isAdmin = true"
  })
  app.save(projectsCollection)

  // ── 2. sprints ───────────────────────────────────────────────
  const sprintsCollection = new Collection({
    type: "base",
    name: "sprints",
    fields: [
      { type: "text", name: "title", required: true, max: 200 },
      {
        type: "relation",
        name: "project",
        required: true,
        collectionId: projectsCollection.id,
        maxSelect: 1,
        cascadeDelete: true
      },
      { type: "date", name: "startDate", required: true },
      { type: "date", name: "endDate", required: true },
      {
        type: "select",
        name: "status",
        required: true,
        values: ["planned", "active", "finished"],
        maxSelect: 1
      },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.isAdmin = true || @request.auth.id != ''",
    updateRule: "@request.auth.isAdmin = true || @request.auth.id != ''",
    deleteRule: "@request.auth.isAdmin = true || @request.auth.id != ''"
  })
  app.save(sprintsCollection)

  // ── 3. kanban_columns — add project ──────────────────────────
  const columnsCollection = app.findCollectionByNameOrId("kanban_columns")
  if (!columnsCollection.fields.find((f) => f.name === "project")) {
    columnsCollection.fields.add(new RelationField({
      name: "project",
      required: true,
      collectionId: projectsCollection.id,
      maxSelect: 1,
      cascadeDelete: true
    }))
    // Ajusta API Rules para exigir participação no projeto
    columnsCollection.listRule = "@request.auth.id != ''"
    columnsCollection.viewRule = "@request.auth.id != ''"
    app.save(columnsCollection)
  }

  // ── 4. kanban_cards — add project + sprint ───────────────────
  const cardsCollection = app.findCollectionByNameOrId("kanban_cards")
  if (!cardsCollection.fields.find((f) => f.name === "project")) {
    cardsCollection.fields.add(new RelationField({
      name: "project",
      required: true,
      collectionId: projectsCollection.id,
      maxSelect: 1,
      cascadeDelete: false
    }))
  }
  if (!cardsCollection.fields.find((f) => f.name === "sprint")) {
    cardsCollection.fields.add(new RelationField({
      name: "sprint",
      required: false,
      collectionId: sprintsCollection.id,
      maxSelect: 1,
      cascadeDelete: false
    }))
  }
  app.save(cardsCollection)

  // ── 5. poker_rooms — add project ─────────────────────────────
  const roomsCollection = app.findCollectionByNameOrId("poker_rooms")
  if (!roomsCollection.fields.find((f) => f.name === "project")) {
    roomsCollection.fields.add(new RelationField({
      name: "project",
      required: true,
      collectionId: projectsCollection.id,
      maxSelect: 1,
      cascadeDelete: false
    }))
    roomsCollection.listRule = "@request.auth.id != ''"
    roomsCollection.viewRule = "@request.auth.id != ''"
    app.save(roomsCollection)
  }

  // ── 6. Seed: projeto "Geral" + sprint padrão ─────────────────
  // Busca admin seed (primeiro admin)
  let adminUser = null
  try {
    const admins = app.findRecordsByFilter("user", "email = 'admin@admin.com'", "", 1, 0)
    if (admins.length > 0) adminUser = admins[0]
  } catch {}

  if (adminUser) {
    // Cria o projeto "Geral"
    const geralProject = new Record(projectsCollection)
    geralProject.set("title", "Geral")
    geralProject.set("description", "Projeto geral para dados migrados do Kanban original")
    geralProject.set("created_by", adminUser.id)
    geralProject.set("responsaveis", [adminUser.id])
    geralProject.set("participants", [adminUser.id])
    app.save(geralProject)

    // Atualiza colunas existentes para apontar para o projeto Geral
    const existingCols = app.findRecordsByFilter("kanban_columns", "", "", -1, 0)
    for (const col of existingCols) {
      if (!col.get("project")) {
        col.set("project", geralProject.id)
        app.save(col)
      }
    }

    // Atualiza cards existentes para apontar para o projeto Geral
    const existingCards = app.findRecordsByFilter("kanban_cards", "", "", -1, 0)
    for (const card of existingCards) {
      if (!card.get("project")) {
        card.set("project", geralProject.id)
        app.save(card)
      }
    }

    // Atualiza salas de poker existentes para apontar para o projeto Geral
    const existingRooms = app.findRecordsByFilter("poker_rooms", "", "", -1, 0)
    for (const room of existingRooms) {
      if (!room.get("project")) {
        room.set("project", geralProject.id)
        app.save(room)
      }
    }

    // Cria sprint padrão ativa para o projeto Geral
    const defaultSprint = new Record(sprintsCollection)
    defaultSprint.set("title", "Sprint 1")
    defaultSprint.set("project", geralProject.id)
    defaultSprint.set("startDate", new Date().toISOString())
    defaultSprint.set("endDate", new Date(Date.now() + 14 * 86400000).toISOString()) // +14 dias
    defaultSprint.set("status", "active")
    app.save(defaultSprint)
  }
}, (app) => {
  const sprints = app.findCollectionByNameOrId("sprints")
  if (sprints) app.delete(sprints)

  const projects = app.findCollectionByNameOrId("projects")
  if (projects) app.delete(projects)

  // Remove campos adicionados nas coleções existentes (PocketBase reverte structural changes?)
  // Na prática o rollback do PocketBase para alterações de schema é limitado.
  // Removemos as coleções de volta caso existam.
  try {
    const cols = app.findCollectionByNameOrId("kanban_columns")
    if (cols) {
      cols.fields.remove("project")
      app.save(cols)
    }
  } catch {}
  try {
    const cards = app.findCollectionByNameOrId("kanban_cards")
    if (cards) {
      cards.fields.remove("project")
      cards.fields.remove("sprint")
      app.save(cards)
    }
  } catch {}
  try {
    const rooms = app.findCollectionByNameOrId("poker_rooms")
    if (rooms) {
      rooms.fields.remove("project")
      app.save(rooms)
    }
  } catch {}
})
