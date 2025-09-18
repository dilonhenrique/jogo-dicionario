import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('game_sessions')
    .addColumn('room_code', 'varchar(8)', (col) => col.primaryKey())
    .addColumn('game_state', 'jsonb', (col) => col.notNull())
    .addColumn('configs', 'jsonb', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo('now()').notNull())
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo('now()').notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('game_sessions').execute();
}
