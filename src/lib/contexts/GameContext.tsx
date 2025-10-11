"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect } from "react";
import { GamePlayer } from "@/types/user";
import { GameConfig, GameStage, GameVotes, SimpleWord, WordRound } from "@/types/game";
import { useRoomChannel } from "./RoomContext";
import { useSession } from "./SessionContext";
import { useGameSync } from "../hooks/useGameSync";
import { gameActions } from "@/server/actions/game";

type GameContextValue = {
  stage: GameStage;
  players: GamePlayer[];
  votes: GameVotes;
  configs: GameConfig;
  currentRound: WordRound | null;
  roundHistory: WordRound[];
  isLoading: boolean;
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

const GameContext = createContext<GameContextValue>({} as GameContextValue);

type Props = PropsWithChildren & {
  configs: GameConfig;
}

function GameProvider({ children, configs }: Props) {
  const { user } = useSession();
  const { code, onGameStateChange } = useRoomChannel();
  const {
    stage,
    players,
    currentRound,
    roundHistory,
    votes: votesMap,
    isLoading,
    refetchAll,
  } = useGameSync(code);

  // Converter Map para objeto somente leitura
  const votes: GameVotes = votesMap as GameVotes;

  // Re-fetch quando houver mudanças no banco
  useEffect(() => {
    refetchAll();
  }, [onGameStateChange, refetchAll]);

  const setWordAndStartFakeStage = useCallback(async (word: SimpleWord) => {
    await gameActions.setWordAndStartFake({
      roomCode: code,
      word,
    });
  }, [code]);

  const addFakeWord = useCallback(async (definition: string) => {
    await gameActions.addFakeDefinition({
      roomCode: code,
      userId: user.id,
      definition,
    });
  }, [code, user.id]);

  const removeFakeWord = useCallback(async () => {
    await gameActions.removeFakeDefinition({
      roomCode: code,
      userId: user.id,
    });
  }, [code, user.id]);

  const vote = useCallback(async (definitionId: string) => {
    // Verificar se está votando na palavra real
    const isRealWord = currentRound?.word.id === definitionId;
    
    await gameActions.addVote({
      roomCode: code,
      userId: user.id,
      definitionId: isRealWord ? null : definitionId,
      isRealWord,
    });
  }, [code, user.id, currentRound]);

  const removeVote = useCallback(async () => {
    await gameActions.removeVote({
      roomCode: code,
      userId: user.id,
    });
  }, [code, user.id]);

  const checkoutCurrentRound = useCallback(async () => {
    await gameActions.checkoutRound({
      roomCode: code,
      configs,
    });
  }, [code, configs]);

  const restartGameAction = useCallback(async () => {
    await gameActions.restartGame({
      roomCode: code,
      configs,
    });
  }, [code, configs]);

  const kickPlayerAction = useCallback(async (userId: string) => {
    await gameActions.kickPlayer({
      roomCode: code,
      userId,
    });
  }, [code]);

  const actions = {
    setWordAndStartFakeStage,
    addFakeWord,
    removeFakeWord,
    vote,
    removeVote,
    checkoutCurrentRound,
    restartGame: restartGameAction,
    kickPlayer: kickPlayerAction,
  }

  return (<GameContext.Provider
    value={{
      stage,
      players,
      votes,
      currentRound,
      roundHistory,
      configs,
      isLoading,
      actions,
    }}
  >
    {children}
  </GameContext.Provider>)
}

function useGame() {
  return useContext(GameContext);
}

export { GameProvider, useGame }
