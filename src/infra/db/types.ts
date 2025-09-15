import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

/** Enums do Postgres mapeados pra TS */
export type DifficultyLevel =
  | "insane" | "very-hard" | "hard" | "medium-hard" | "medium" | "easy";

export type PosTag =
  | "noun" | "verb" | "adj" | "adv" | "pron" | "prep" | "conj" | "interj"
  | "num" | "det" | "abbr" | "prefix" | "suffix" | "other";

/**
 * Obs sobre numeric:
 * Por padrão o driver `pg` devolve NUMERIC como string.
 * Se você quiser number, veja a nota no arquivo db/index.ts sobre "numeric parser".
 */
type Numeric = string;

/** Tabela: words */
export interface WordsTable {
  id: ColumnType<string, string | undefined, never>;
  word: string;
  lemma: string;
  zipf: Numeric;                      // numeric(5,3)
  difficulty: DifficultyLevel;
  lang_code: string;                  // ex: 'pt'
  pos: PosTag;
  definition: string;
  glosses: string[];                  // jsonb
  source: string | null;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date>;
}

/** Tabela: word_votes */
export interface WordVotesTable {
  word_id: string;                    // uuid FK -> words.id
  user_id: string;                    // uuid (ou outro id)
  vote: 1 | -1;                       // smallint com check (-1, 1)
  created_at: ColumnType<Date, string | Date | undefined, never>;
}

/** View: word_scores (somente leitura) */
export interface WordScoresView {
  word_id: string;
  likes: number;
  dislikes: number;
  score: number;
}

/** Interface Database (Kysely) */
export interface Database {
  words: WordsTable;
  word_votes: WordVotesTable;
  word_scores: WordScoresView;
}

/** Helpers de tipo por tabela */
export type Words = Selectable<WordsTable>;
export type NewWord = Insertable<WordsTable>;
export type UpdateWord = Updateable<WordsTable>;

export type WordVote = Selectable<WordVotesTable>;
export type NewWordVote = Insertable<WordVotesTable>;
