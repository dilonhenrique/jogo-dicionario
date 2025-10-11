import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Tabela de jogadores da partida
  await db.schema
    .createTable('game_players')
    .addColumn('room_code', 'varchar(8)', (col) => col.notNull())
    .addColumn('user_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('user_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('points', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('joined_at', 'timestamptz', (col) => col.notNull().defaultTo('now()'))
    .addColumn('kicked_at', 'timestamptz')
    .addPrimaryKeyConstraint('game_players_pk', ['room_code', 'user_id'])
    .execute();

  await db.schema
    .createIndex('idx_game_players_room')
    .on('game_players')
    .column('room_code')
    .execute();

  // Tabela de rodadas
  await db.schema
    .createTable('game_rounds')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('room_code', 'varchar(8)', (col) => col.notNull())
    .addColumn('round_number', 'integer', (col) => col.notNull())
    .addColumn('word_id', 'uuid', (col) => col.notNull())
    .addColumn('word_label', 'varchar(255)', (col) => col.notNull())
    .addColumn('word_definition', 'text', (col) => col.notNull())
    .addColumn('started_at', 'timestamptz', (col) => col.notNull().defaultTo('now()'))
    .addColumn('finished_at', 'timestamptz')
    .addUniqueConstraint('game_rounds_room_number_unique', ['room_code', 'round_number'])
    .execute();

  await db.schema
    .createIndex('idx_game_rounds_room')
    .on('game_rounds')
    .column('room_code')
    .execute();

  await db.schema
    .createIndex('idx_game_rounds_active')
    .on('game_rounds')
    .columns(['room_code', 'finished_at'])
    .where('finished_at', 'is', null)
    .execute();

  // Tabela de definições falsas
  await db.schema
    .createTable('game_fake_definitions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('round_id', 'uuid', (col) => col.notNull())
    .addColumn('author_user_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('definition', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo('now()'))
    .addUniqueConstraint('game_fake_definitions_round_author_unique', ['round_id', 'author_user_id'])
    .execute();

  await db.schema
    .createIndex('idx_fake_defs_round')
    .on('game_fake_definitions')
    .column('round_id')
    .execute();

  // Tabela de votos
  await db.schema
    .createTable('game_votes')
    .addColumn('round_id', 'uuid', (col) => col.notNull())
    .addColumn('user_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('definition_id', 'uuid')
    .addColumn('is_real_word', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('voted_at', 'timestamptz', (col) => col.notNull().defaultTo('now()'))
    .addPrimaryKeyConstraint('game_votes_pk', ['round_id', 'user_id'])
    .execute();

  await db.schema
    .createIndex('idx_game_votes_round')
    .on('game_votes')
    .column('round_id')
    .execute();

  // Adicionar foreign keys após criar todas as tabelas
  await db.schema
    .alterTable('game_players')
    .addForeignKeyConstraint(
      'fk_game_players_room',
      ['room_code'],
      'game_sessions',
      ['room_code']
    )
    .onDelete('cascade')
    .execute();

  await db.schema
    .alterTable('game_rounds')
    .addForeignKeyConstraint(
      'fk_game_rounds_room',
      ['room_code'],
      'game_sessions',
      ['room_code']
    )
    .onDelete('cascade')
    .execute();

  await db.schema
    .alterTable('game_rounds')
    .addForeignKeyConstraint(
      'fk_game_rounds_word',
      ['word_id'],
      'words',
      ['id']
    )
    .execute();

  await db.schema
    .alterTable('game_fake_definitions')
    .addForeignKeyConstraint(
      'fk_fake_defs_round',
      ['round_id'],
      'game_rounds',
      ['id']
    )
    .onDelete('cascade')
    .execute();

  await db.schema
    .alterTable('game_votes')
    .addForeignKeyConstraint(
      'fk_game_votes_round',
      ['round_id'],
      'game_rounds',
      ['id']
    )
    .onDelete('cascade')
    .execute();

  // Atualizar tabela game_sessions
  await db.schema
    .alterTable('game_sessions')
    .addColumn('stage', 'varchar(20)', (col) => col.notNull().defaultTo('word_pick'))
    .addColumn('current_round_id', 'uuid')
    .execute();

  await db.schema
    .alterTable('game_sessions')
    .addForeignKeyConstraint(
      'fk_current_round',
      ['current_round_id'],
      'game_rounds',
      ['id']
    )
    .execute();

  await db.schema
    .createIndex('idx_game_sessions_current_round')
    .on('game_sessions')
    .column('current_round_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Remover em ordem reversa devido às foreign keys
  await db.schema.dropTable('game_votes').ifExists().execute();
  await db.schema.dropTable('game_fake_definitions').ifExists().execute();
  await db.schema.dropTable('game_rounds').ifExists().execute();
  await db.schema.dropTable('game_players').ifExists().execute();
  
  // Remover colunas adicionadas em game_sessions
  await db.schema
    .alterTable('game_sessions')
    .dropColumn('stage')
    .execute();
    
  await db.schema
    .alterTable('game_sessions')
    .dropColumn('current_round_id')
    .execute();
}
