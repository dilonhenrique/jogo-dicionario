import { User } from "./user";

export type GameStage = "word_pick" | "definition" | "guess" | "result" | "finishing";

export type GameConfig = {
  maxPoints: number | null;
}

export type SimpleWord = {
  label: string;
  definition: string;
}

export type WordDefinition = SimpleWord & {
  id: string;
  votes: User[];
}

export type FakeWord = WordDefinition & {
  author: User;
}

export type WordRound = {
  word: WordDefinition;
  fakes: FakeWord[];
}