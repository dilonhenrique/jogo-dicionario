import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "./types";

let _db: Kysely<Database> | undefined;

export function getDb(): Kysely<Database> {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  
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

const db = new Proxy({} as Kysely<Database>, {
  get(_target, prop) {
    const instance = getDb();
    const value = instance[prop as keyof Kysely<Database>];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
  has(_target, prop) {
    return prop in getDb();
  },
  ownKeys() {
    return Reflect.ownKeys(getDb());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getDb(), prop);
  }
});

export default db;
