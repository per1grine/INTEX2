import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { withClient } from './_db.mjs'

const now = new Date()

const users = [
  {
    firstName: 'Test',
    email: 'test@example.com',
    username: 'testuser',
    password: 'Password123!',
  },
  {
    firstName: 'Allen',
    email: 'allen@example.com',
    username: 'allen',
    password: 'Password123!',
  },
]

await withClient(async (client) => {
  for (const u of users) {
    const id = randomUUID()
    const passwordHash = await bcrypt.hash(u.password, 10)
    await client.query(
      `
      INSERT INTO "Users" ("Id","FirstName","Email","Username","PasswordHash","CreatedAtUtc")
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT ("Username") DO NOTHING;
      `,
      [id, u.firstName, u.email.toLowerCase(), u.username, passwordHash, now],
    )
  }
  console.log(`Seed complete: ensured ${users.length} test users.`)
})

