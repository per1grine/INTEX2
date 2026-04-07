import { withClient } from './_db.mjs'

// Initial schema for current app needs (matches EF migration: Users table).
await withClient(async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "Users" (
      "Id" uuid PRIMARY KEY,
      "FirstName" varchar(64) NOT NULL,
      "Email" varchar(256) NOT NULL,
      "Username" varchar(64) NOT NULL,
      "PasswordHash" text NOT NULL,
      "IsDonor" boolean NOT NULL DEFAULT false,
      "IsAdmin" boolean NOT NULL DEFAULT false,
      "CreatedAtUtc" timestamptz NOT NULL
    );
  `)

  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Username" ON "Users" ("Username");`)
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");`)

  await client.query(`
    CREATE TABLE IF NOT EXISTS "AddCodes" (
      "Code" varchar(64) PRIMARY KEY,
      "CreatedAtUtc" timestamptz NOT NULL
    );
  `)

  console.log('Database setup complete: tables/indexes ensured.')
})

