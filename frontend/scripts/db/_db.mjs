import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add it to frontend/.env (example: postgresql://user:pass@localhost:5432/intex)',
    )
  }
  return url
}

function getDbName(databaseUrl) {
  const u = new URL(databaseUrl)
  return decodeURIComponent(u.pathname.replace(/^\//, '')) || 'postgres'
}

function setDbName(databaseUrl, dbName) {
  const u = new URL(databaseUrl)
  u.pathname = `/${encodeURIComponent(dbName)}`
  return u.toString()
}

async function withAdminClient(fn) {
  const url = getDatabaseUrl()
  const adminUrl = setDbName(url, 'postgres')
  const client = new Client({ connectionString: adminUrl })
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}

export async function ensureDatabaseExists() {
  const url = getDatabaseUrl()
  const dbName = getDbName(url)
  if (!dbName || dbName === 'postgres') return

  await withAdminClient(async (client) => {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1;', [dbName])
    if (exists.rowCount && exists.rowCount > 0) return
    await client.query(`CREATE DATABASE "${dbName.replaceAll('"', '""')}"`)
    console.log(`Database created: ${dbName}`)
  })
}

export async function withClient(fn) {
  await ensureDatabaseExists()
  const client = new Client({ connectionString: getDatabaseUrl() })
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}

