import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Adicionar novos valores ao enum pos_tag
  await sql`ALTER TYPE pos_tag ADD VALUE IF NOT EXISTS 'phrase'`.execute(db);
  await sql`ALTER TYPE pos_tag ADD VALUE IF NOT EXISTS 'intj'`.execute(db);
  await sql`ALTER TYPE pos_tag ADD VALUE IF NOT EXISTS 'abbrev'`.execute(db);
  await sql`ALTER TYPE pos_tag ADD VALUE IF NOT EXISTS 'contraction'`.execute(db);
  await sql`ALTER TYPE pos_tag ADD VALUE IF NOT EXISTS 'name'`.execute(db);
}

export async function down(): Promise<void> {
  // Não é possível remover valores de um enum que pode estar sendo usado
  // Se necessário, seria preciso recriar o enum completamente
}
