migrate((app) => {
  const email = $os.getenv("SEED_ADMIN_EMAIL")
  const record = app.findAuthRecordByEmail("auth", email)
  record.set("emailVisibility", true)
  app.save(record)
}, (app) => {
  const email = $os.getenv("SEED_ADMIN_EMAIL")
  const record = app.findAuthRecordByEmail("auth", email)
  record.set("emailVisibility", false)
  app.save(record)
})
