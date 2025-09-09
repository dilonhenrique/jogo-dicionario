"use client";

import { createContext, PropsWithChildren, useContext, useState } from "react";
import { GamePlayer } from "@/types/user";
import { GameConfig, GameStage, WordRound } from "@/types/game";
import { useGameStage } from "../hooks/useGameStage";
import { useGamePlayers } from "../hooks/useGamePlayers";

type GameContextValue = {
  stage: GameStage;
  players: GamePlayer[];
  configs: GameConfig;
  currentRound: WordRound | null;
  roundHistory: WordRound[];
}

const defaultConfig: GameConfig = {
  maxPoints: 5,
}

const GameContext = createContext<GameContextValue>({} as GameContextValue);

function GameProvider({ children }: PropsWithChildren) {
  const { stage } = useGameStage();
  const { players } = useGamePlayers();

  const [currentRound, setCurrentRound] = useState<WordRound | null>(null);
  const [roundHistory, setRoundHistory] = useState<WordRound[]>([]);

  return (<GameContext.Provider
    value={{
      stage,
      players,
      configs: defaultConfig,
      currentRound,
      roundHistory,
    }}
  >
    {children}
  </GameContext.Provider>)
}

function useGame() {
  return useContext(GameContext);
}

export { GameProvider, useGame }