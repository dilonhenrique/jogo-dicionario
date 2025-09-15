import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "./types";
import dotenv from "dotenv";

const envs = dotenv.config();
const connectionString = envs.parsed?.DATABASE_URL;

let _db: Kysely<Database> | undefined;

export function getDb(): Kysely<Database> {
  if (_db) return _db;

  if (!connectionString) {
    throw new Error("Não tem env do banco");
  }

  const pool = new Pool({ connectionString, max: 10 });
  _db = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });

  return _db;
}

export async function destroyDb(): Promise<void> {
  if (_db) {
    // @ts-expect-error: access dialect internals to close pool
    const pool: Pool = _db.getExecutor().adapter?.pool ?? _db["__dialect"]?.pool;
    await _db.destroy();
    await pool?.end().catch(() => { });
    _db = undefined;
  }
}

const db = getDb();
export default db;
