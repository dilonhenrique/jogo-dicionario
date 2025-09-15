import { Database } from '@/infra/db/types';
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<Database>): Promise<void> {
  await sql`CREATE TYPE difficulty_level AS ENUM ('insane','very-hard','hard','medium-hard','medium','easy')`.execute(db);
  await sql`CREATE TYPE pos_tag AS ENUM ('noun','verb','adj','adv','pron','prep','conj','interj','num','det','abbr','prefix','suffix','other')`.execute(db);

  await db.schema
    .createTable('words')
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('word', 'text', col => col.notNull())
    .addColumn('lemma', 'text', col => col.notNull())
    .addColumn('zipf', 'numeric', col => col.notNull())
    .addColumn('difficulty', sql`difficulty_level`, col => col.notNull())
    .addColumn('lang_code', 'text', col => col.notNull())
    .addColumn('pos', sql`pos_tag`, col => col.notNull())
    .addColumn('definition', 'text', col => col.notNull())
    .addColumn('glosses', 'jsonb', col => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('source', 'text')
    .addColumn('created_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('word_votes')
    .addColumn('word_id', 'uuid', col => col.notNull().references('words.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', col => col.notNull())
    .addColumn('vote', 'int2', col => col.notNull())
    .addColumn('created_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addPrimaryKeyConstraint('word_votes_pk', ['word_id','user_id'])
    .execute();

  await sql`CREATE UNIQUE INDEX words_lang_word_unique ON words (lang_code, word)`.execute(db);
  await sql`CREATE INDEX words_lang_pos_idx ON words (lang_code, pos)`.execute(db);
  await sql`CREATE INDEX word_votes_word_idx ON word_votes (word_id)`.execute(db);

  await sql`
    CREATE VIEW word_scores AS
    SELECT
      w.id AS word_id,
      COALESCE(SUM(CASE WHEN v.vote = 1 THEN 1 ELSE 0 END),0)  AS likes,
      COALESCE(SUM(CASE WHEN v.vote = -1 THEN 1 ELSE 0 END),0) AS dislikes,
      COALESCE(SUM(v.vote),0) AS score
    FROM words w
    LEFT JOIN word_votes v ON v.word_id = w.id
    GROUP BY w.id
  `.execute(db);
}

export async function down(db: Kysely<Database>): Promise<void> {
  await sql`DROP VIEW IF EXISTS word_scores`.execute(db);
  await db.schema.dropTable('word_votes').execute();
  await db.schema.dropTable('words').execute();
  await sql`DROP TYPE IF EXISTS pos_tag`.execute(db);
  await sql`DROP TYPE IF EXISTS difficulty_level`.execute(db);
}
