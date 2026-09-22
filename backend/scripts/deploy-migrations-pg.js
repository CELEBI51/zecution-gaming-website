import 'dotenv/config'
import { createHash, randomUUID } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'

const migrationsDirectory = path.resolve('prisma', 'migrations')
const connectionString = process.env.DIRECT_URL

if (!connectionString) {
  throw new Error('DIRECT_URL tanimli degil.')
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15_000,
})

const ensureMigrationsTable = async () => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `)
}

const deploy = async () => {
  await client.connect()
  await client.query('SELECT pg_advisory_lock($1)', [72419026])

  try {
    await ensureMigrationsTable()

    const entries = await readdir(migrationsDirectory, { withFileTypes: true })
    const migrations = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()

    for (const migrationName of migrations) {
      const sql = await readFile(
        path.join(migrationsDirectory, migrationName, 'migration.sql'),
        'utf8',
      )
      const checksum = createHash('sha256').update(sql).digest('hex')
      const existing = await client.query(
        `SELECT "checksum", "finished_at", "rolled_back_at"
         FROM "_prisma_migrations"
         WHERE "migration_name" = $1
         ORDER BY "started_at" DESC
         LIMIT 1`,
        [migrationName],
      )

      if (existing.rowCount > 0 && existing.rows[0].finished_at && !existing.rows[0].rolled_back_at) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(`${migrationName} daha once farkli bir checksum ile uygulanmis.`)
        }
        console.log(`Atlandi: ${migrationName}`)
        continue
      }

      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          `INSERT INTO "_prisma_migrations"
            ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
           VALUES ($1, $2, now(), $3, 1)`,
          [randomUUID(), checksum, migrationName],
        )
        await client.query('COMMIT')
        console.log(`Uygulandi: ${migrationName}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [72419026]).catch(() => {})
    await client.end()
  }
}

deploy().catch((error) => {
  console.error('Migration uygulanamadi:', error.message)
  process.exit(1)
})
