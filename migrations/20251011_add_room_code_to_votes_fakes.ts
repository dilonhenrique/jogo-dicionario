import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Adicionar room_code a game_fake_definitions
  await db.schema
    .alterTable('game_fake_definitions')
    .addColumn('room_code', 'varchar(8)', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('idx_fake_defs_room_code')
    .on('game_fake_definitions')
    .column('room_code')
    .execute();

  // Adicionar room_code a game_votes
  await db.schema
    .alterTable('game_votes')
    .addColumn('room_code', 'varchar(8)', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('idx_game_votes_room_code')
    .on('game_votes')
    .column('room_code')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .dropIndex('idx_fake_defs_room_code')
    .execute();

  await db.schema
    .alterTable('game_fake_definitions')
    .dropColumn('room_code')
    .execute();

  await db.schema
    .dropIndex('idx_game_votes_room_code')
    .execute();

  await db.schema
    .alterTable('game_votes')
    .dropColumn('room_code')
    .execute();
}
