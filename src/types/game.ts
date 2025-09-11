import { GamePlayer, User } from "./user";

export type GameStage = "word_pick" | "fake" | "vote" | "blame" | "finishing";

export type GameConfig = {
  enableHostChooseWord: boolean;
  enableMaxPoints: boolean;
  maxPoints: number;
}

export type SimpleWord = {
  label: string;
  definition: string;
}

export type WordDictionary = SimpleWord & {
  id: string;
  // votes: User[];
}

export type FakeWord = Omit<WordDictionary, "label"> & {
  author: User;
}

export type WordRound = {
  word: WordDictionary;
  fakes: FakeWord[];
}

export type GameState = {
  players: GamePlayer[];
  stage: GameStage;
  currentRound: WordRound | null;
  roundHistory: WordRound[];
  votes: [string, string][];
}