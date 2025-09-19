import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('rooms')
    .addColumn('configs', 'jsonb', (col) => col.defaultTo('{}'))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('rooms')
    .dropColumn('configs')
    .execute();
}
