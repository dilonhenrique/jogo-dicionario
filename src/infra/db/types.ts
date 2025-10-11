import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";
import type { GameStage } from "@/types/game";

export type DifficultyLevel =
  | "insane" | "very-hard" | "hard" | "medium-hard" | "medium" | "easy";

export type PosTag =
  | "noun" | "verb" | "adj" | "adv" | "pron" | "prep" | "conj" | "interj"
  | "num" | "det" | "abbr" | "prefix" | "suffix" | "other"
  | "phrase" | "intj" | "abbrev" | "contraction" | "name";

type Numeric = string;
type JsonValue = object | string | number | boolean | null;

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

export interface GameSessionsTable {
  room_code: string;
  game_state: JsonValue;
  stage: GameStage;
  current_round_id: string | null;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date>;
}

export interface GamePlayersTable {
  room_code: string;
  user_id: string;
  user_name: string;
  points: number;
  joined_at: ColumnType<Date, string | Date | undefined, never>;
  kicked_at: ColumnType<Date | null, string | Date | null | undefined, string | Date | null>;
}

export interface GameRoundsTable {
  id: ColumnType<string, string | undefined, never>;
  room_code: string;
  round_number: number;
  word_id: string;
  word_label: string;
  word_definition: string;
  started_at: ColumnType<Date, string | Date | undefined, never>;
  finished_at: ColumnType<Date | null, string | Date | null | undefined, string | Date | null>;
}

export interface GameFakeDefinitionsTable {
  id: ColumnType<string, string | undefined, never>;
  round_id: string;
  author_user_id: string;
  definition: string;
  created_at: ColumnType<Date, string | Date | undefined, never>;
}

export interface GameVotesTable {
  round_id: string;
  user_id: string;
  definition_id: string | null;
  is_real_word: boolean;
  voted_at: ColumnType<Date, string | Date | undefined, never>;
}

export interface RoomsTable {
  code: string;
  host_user_id: string;
  host_user_name: string;
  configs: JsonValue;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  expires_at: Date;
}

export interface Database {
  words: WordsTable;
  word_votes: WordVotesTable;
  word_scores: WordScoresView;
  game_sessions: GameSessionsTable;
  game_players: GamePlayersTable;
  game_rounds: GameRoundsTable;
  game_fake_definitions: GameFakeDefinitionsTable;
  game_votes: GameVotesTable;
  rooms: RoomsTable;
}

export type Word = Selectable<WordsTable>;
export type NewWord = Insertable<WordsTable>;
export type UpdateWord = Updateable<WordsTable>;

export type GameSession = Selectable<GameSessionsTable>;
export type NewGameSession = Insertable<GameSessionsTable>;
export type UpdateGameSession = Updateable<GameSessionsTable>;

export type GamePlayer = Selectable<GamePlayersTable>;
export type NewGamePlayer = Insertable<GamePlayersTable>;
export type UpdateGamePlayer = Updateable<GamePlayersTable>;

export type GameRound = Selectable<GameRoundsTable>;
export type NewGameRound = Insertable<GameRoundsTable>;
export type UpdateGameRound = Updateable<GameRoundsTable>;

export type GameFakeDefinition = Selectable<GameFakeDefinitionsTable>;
export type NewGameFakeDefinition = Insertable<GameFakeDefinitionsTable>;
export type UpdateGameFakeDefinition = Updateable<GameFakeDefinitionsTable>;

export type GameVote = Selectable<GameVotesTable>;
export type NewGameVote = Insertable<GameVotesTable>;
export type UpdateGameVote = Updateable<GameVotesTable>;

export type Room = Selectable<RoomsTable>;
export type NewRoom = Insertable<RoomsTable>;
export type UpdateRoom = Updateable<RoomsTable>;

export type RoomComplete = Room & { game_state?: GameSession["game_state"] };

export type WordVote = Selectable<WordVotesTable>;
export type NewWordVote = Insertable<WordVotesTable>;
