import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('game_sessions')
    .dropColumn('configs')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('game_sessions')
    .addColumn('configs', 'jsonb', (col) => col.defaultTo('{}'))
    .execute();
}
