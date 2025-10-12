import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Remover a constraint atual
  await db.schema
    .alterTable('game_rounds')
    .dropConstraint('fk_game_rounds_word')
    .execute();

  // Tornar word_id nullable
  await db.schema
    .alterTable('game_rounds')
    .alterColumn('word_id', (col) => col.dropNotNull())
    .execute();

  // Recriar constraint permitindo NULL
  await db.schema
    .alterTable('game_rounds')
    .addForeignKeyConstraint(
      'fk_game_rounds_word',
      ['word_id'],
      'words',
      ['id']
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Remover constraint
  await db.schema
    .alterTable('game_rounds')
    .dropConstraint('fk_game_rounds_word')
    .execute();

  // Tornar word_id NOT NULL novamente
  await db.schema
    .alterTable('game_rounds')
    .alterColumn('word_id', (col) => col.setNotNull())
    .execute();

  // Recriar constraint original
  await db.schema
    .alterTable('game_rounds')
    .addForeignKeyConstraint(
      'fk_game_rounds_word',
      ['word_id'],
      'words',
      ['id']
    )
    .execute();
}
