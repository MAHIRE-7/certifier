import { serve } from '@hono/node-server';
import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createApiApp } from './app';
import { createLocalSqliteDb } from './db';

const PORT = 8787;
const DB_FILE = path.resolve(process.cwd(), 'local.sqlite');

console.log(`[DevServer] Initializing local SQLite database at: ${DB_FILE}`);
const sqlite = new DatabaseSync(DB_FILE);

// Run migrations if needed
const migrationPath = path.resolve(process.cwd(), '../../db/migrations/0001_initial_schema.sql');
const altMigrationPath = path.resolve(process.cwd(), 'db/migrations/0001_initial_schema.sql');
const activeMigrationPath = fs.existsSync(migrationPath) ? migrationPath : altMigrationPath;

if (fs.existsSync(activeMigrationPath)) {
  console.log(`[DevServer] Applying migration: ${activeMigrationPath}`);
  const sql = fs.readFileSync(activeMigrationPath, 'utf8');
  sqlite.exec(sql);
}

// Check if seed data exists, if not run seed
const seedCheck = sqlite.prepare('SELECT COUNT(*) as count FROM organizations').get() as { count: number };
if (!seedCheck || seedCheck.count === 0) {
  const seedPath = path.resolve(process.cwd(), '../../db/seed.sql');
  const altSeedPath = path.resolve(process.cwd(), 'db/seed.sql');
  const activeSeedPath = fs.existsSync(seedPath) ? seedPath : altSeedPath;
  if (fs.existsSync(activeSeedPath)) {
    console.log(`[DevServer] Seeding database from: ${activeSeedPath}`);
    const seedSql = fs.readFileSync(activeSeedPath, 'utf8');
    sqlite.exec(seedSql);
  }
}

const db = createLocalSqliteDb(sqlite);
const app = createApiApp();

// Bind environment variables for local dev
const handler = (req: Request) => {
  const env = {
    DB: db,
    JWT_SECRET: process.env.JWT_SECRET || 'dev_insecure_jwt_secret_key_32bytes!!',
    PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || `http://localhost:5173`,
    ENVIRONMENT: 'development'
  };
  return app.fetch(req, env);
};

console.log(`[DevServer] API running at http://localhost:${PORT}/api/v1`);
serve({
  fetch: handler,
  port: PORT
});
