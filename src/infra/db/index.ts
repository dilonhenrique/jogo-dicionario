import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "./types";

let _db: Kysely<Database> | undefined;

// Função para criar/obter a instância do DB (usada pelos scripts com dotenv)
export function getDb(): Kysely<Database> {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada");
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

// Instância direta para uso na aplicação Next.js (lê env nativamente)
// Só inicializa se DATABASE_URL estiver disponível (não roda em scripts com dotenv)
let db: Kysely<Database>;

if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  db = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });
} else {
  // Em scripts, usar getDb() que lê a env depois do dotenv.config()
  db = new Proxy({} as Kysely<Database>, {
    get() {
      throw new Error('Use getDb() em scripts, não db diretamente');
    }
  });
}

export default db;
