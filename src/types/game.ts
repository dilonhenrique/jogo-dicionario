import { User } from "./user";

export type GameStage = "setup" | "word_pick" | "definition" | "guess" | "result" | "finishing";

export type GameConfig = {
  maxPoints: number | null;
}

export type WordDefinition = {
  label: string;
  definition: string;
  votes: User[];
}

export type WordGuess = WordDefinition & {
  author: User;
}

export type WordRound = {
  word: WordDefinition;
  guesses: WordGuess[];
}