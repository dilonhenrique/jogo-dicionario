import { GameConfig, GameStage, GameVotes, SimpleWord, WordRound } from "@/types/game";
import { GamePlayer } from "@/types/user";

export type GameContextIdleValue = {
  hasStarted: false;
  start: () => void;
}

export type GameContextActiveValue = {
  hasStarted: true;
  stage: GameStage;
  players: GamePlayer[];
  votes: GameVotes;
  configs: GameConfig;
  currentRound: WordRound | null;
  roundHistory: WordRound[];
  currentRoundPoints: Map<string, number>;
  isLoading: boolean;
  refetchAll: () => Promise<void>;
  actions: {
    setWordAndStartFakeStage: (word: SimpleWord) => Promise<void>;
    addFakeWord: (definition: string) => Promise<void>;
    removeFakeWord: () => Promise<void>;
    vote: (definitionId: string) => Promise<void>;
    removeVote: () => Promise<void>;
    checkoutCurrentRound: () => Promise<void>;
    restartGame: () => Promise<void>;
    kickPlayer: (userId: string) => Promise<void>;
  }
}

export type GameContextValue = GameContextIdleValue | GameContextActiveValue;
