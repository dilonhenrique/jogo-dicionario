import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

export type DifficultyLevel =
  | "insane" | "very-hard" | "hard" | "medium-hard" | "medium" | "easy";

export type PosTag =
  | "noun" | "verb" | "adj" | "adv" | "pron" | "prep" | "conj" | "interj"
  | "num" | "det" | "abbr" | "prefix" | "suffix" | "other";

type Numeric = string;

export interface WordsTable {
  id: ColumnType<string, string | undefined, never>;
  word: string;
  lemma: string;
  zipf: Numeric;
  difficulty: DifficultyLevel;
  lang_code: string;
  pos: PosTag;
  definition: string;
  glosses: string[];
  source: string | null;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date>;
}

export interface WordVotesTable {
  word_id: string;
  user_id: string;
  vote: 1 | -1;
  created_at: ColumnType<Date, string | Date | undefined, never>;
}

export interface WordScoresView {
  word_id: string;
  likes: number;
  dislikes: number;
  score: number;
}

export interface Database {
  words: WordsTable;
  word_votes: WordVotesTable;
  word_scores: WordScoresView;
}

export type Words = Selectable<WordsTable>;
export type NewWord = Insertable<WordsTable>;
export type UpdateWord = Updateable<WordsTable>;

export type WordVote = Selectable<WordVotesTable>;
export type NewWordVote = Insertable<WordVotesTable>;
