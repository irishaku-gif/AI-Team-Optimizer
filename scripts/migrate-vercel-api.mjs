import { createRequire } from "node:module";
import pg from "pg";

const require = createRequire(import.meta.url);
const { migrations } = require("../api/migrations.js");
const { Pool } = pg;

const CONNECTION_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_PRISMA_URL",
];

function getConnectionString() {
  for (const key of CONNECTION_ENV_KEYS) {
    if (process.env[key]) return process.env[key];
  }
  return undefined;
}

function shouldUseSsl(connectionString) {
  try {
    const hostname = new URL(connectionString).hostname;
    return hostname !== "localhost" && hostname !== "127.0.0.1";
  } catch {
    return true;
  }
}

const connectionString = getConnectionString();

if (!connectionString) {
  console.error("No PostgreSQL connection string found. Set DATABASE_URL or POSTGRES_URL before running migrations.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  max: 1,
  ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
});

const client = await pool.connect();

try {
  await client.query("begin");
  await client.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamp with time zone not null default now()
    )
  `);

  for (const migration of migrations) {
    const existing = await client.query("select id from schema_migrations where id = $1", [migration.id]);
    if (existing.rowCount) {
      console.log(`Migration already applied: ${migration.id}`);
      continue;
    }

    console.log(`Applying migration: ${migration.id}`);
    for (const statement of migration.statements) {
      await client.query(statement);
    }
    await client.query("insert into schema_migrations (id) values ($1)", [migration.id]);
  }

  await client.query("commit");
  console.log("Database migrations are up to date.");
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  console.error("Database migration failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}