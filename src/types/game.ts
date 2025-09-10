import { User } from "./user";

export type GameStage = "word_pick" | "fake" | "vote" | "blame" | "finishing";

export type GameConfig = {
  maxPoints: number | null;
}

export type SimpleWord = {
  label: string;
  definition: string;
}

export type WordDictionary = SimpleWord & {
  id: string;
  votes: User[];
}

export type FakeWord = Omit<WordDictionary, "label"> & {
  author: User;
}

export type WordRound = {
  word: WordDictionary;
  fakes: FakeWord[];
}