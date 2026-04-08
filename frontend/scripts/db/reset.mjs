import { withClient } from './_db.mjs'

// Wipes ALL app tables (public schema) then recreates schema.
await withClient(async (client) => {
  await client.query('BEGIN')
  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;')
    await client.query('CREATE SCHEMA public;')
    await client.query('GRANT ALL ON SCHEMA public TO public;')
    await client.query('COMMIT')
    console.log('Database reset: public schema dropped/recreated.')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  }
})
