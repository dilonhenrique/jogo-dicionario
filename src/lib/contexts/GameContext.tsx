"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { Player } from "@/types/user";
import { GameConfig, GameStage, WordRound } from "@/types/game";
import { useRoomChannel } from "./RoomContext";
import { useGameStage } from "../hooks/useGameStage";

type GameContextValue = {
  stage: GameStage;
  players: Player[];
  points: Record<string, number>;
  configs: GameConfig;
  currentRound: WordRound | null;
  roundHistory: WordRound[];
}

const defaultConfig: GameConfig = {
  maxPoints: 5,
}

const GameContext = createContext<GameContextValue>({} as GameContextValue);

function GameProvider({ children }: PropsWithChildren) {
  const { players: onlinePlayers } = useRoomChannel();

  const { stage } = useGameStage();
  const [players, setPlayers] = useState<Player[]>(onlinePlayers);
  const [points, setPoints] = useState<Record<string, number>>({});

  const [currentRound, setCurrentRound] = useState<WordRound | null>(null);
  const [roundHistory, setRoundHistory] = useState<WordRound[]>([]);

  useEffect(() => {
    setPlayers(players => players.map(
      (player) => ({
        ...player,
        onlineAt: onlinePlayers.find(p => player.id === p.id)?.onlineAt ?? null,
      })
    ));
  }, [onlinePlayers]);


  return (<GameContext.Provider
    value={{
      stage,
      players,
      points,
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