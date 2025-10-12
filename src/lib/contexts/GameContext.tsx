"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo } from "react";
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

const GameContext = createContext<GameContextValue>({} as GameContextValue);

type Props = PropsWithChildren & {
  configs: GameConfig;
}

function GameProvider({ children, configs }: Props) {
  const { user } = useSession();
  const { 
    code, 
    gameStateChangeCounter, 
    onlinePlayers, 
    setRefetchGame,
    setUpdateStage,
    setUpdatePlayers,
    setUpdateCurrentRound,
    setUpdateVotes,
  } = useRoomChannel();
  const {
    stage,
    players: gamePlayers,
    currentRound,
    roundHistory,
    votes: votesMap,
    currentRoundPoints,
    isLoading,
    refetchAll,
    refetchCurrentRoundPoints,
    updateStageFromPayload,
    updatePlayersFromPayload,
    updateCurrentRoundFromPayload,
    updateVotesFromPayload,
  } = useGameSync(code);

  const votes: GameVotes = votesMap as GameVotes;

  const players = useMemo(() => {
    return gamePlayers.map(p => {
      const onlinePlayer = onlinePlayers.find(op => op.id === p.id);
      return {
        ...p,
        onlineAt: onlinePlayer?.onlineAt || null,
        isHost: onlinePlayer?.isHost || false,
      };
    });
  }, [gamePlayers, onlinePlayers]);

  useEffect(() => {
    setRefetchGame(refetchAll);
  }, [refetchAll, setRefetchGame]);

  useEffect(() => {
    setUpdateStage(updateStageFromPayload);
    setUpdatePlayers(updatePlayersFromPayload);
    setUpdateCurrentRound(updateCurrentRoundFromPayload);
    setUpdateVotes(updateVotesFromPayload);
  }, [setUpdateStage, setUpdatePlayers, setUpdateCurrentRound, setUpdateVotes, updateStageFromPayload, updatePlayersFromPayload, updateCurrentRoundFromPayload, updateVotesFromPayload]);

  useEffect(() => {
    refetchAll();
  }, [gameStateChangeCounter, refetchAll]);

  useEffect(() => {
    if (stage === 'blame') {
      refetchCurrentRoundPoints();
    }
  }, [stage, refetchCurrentRoundPoints]);

  const setWordAndStartFakeStage = useCallback(async (word: SimpleWord) => {
    await gameActions.setWordAndStartFake({
      roomCode: code,
      word,
    });
  }, [code]);

  const addFakeWord = useCallback(async (definition: string) => {
    if (!currentRound?.id) {
      throw new Error('Nenhuma rodada ativa');
    }
    
    await gameActions.addFakeDefinition({
      currentRoundId: currentRound.id,
      roomCode: code,
      userId: user.id,
      definition,
    });
  }, [code, user.id, currentRound]);

  const removeFakeWord = useCallback(async () => {
    if (!currentRound?.id) {
      throw new Error('Nenhuma rodada ativa');
    }
    
    await gameActions.removeFakeDefinition({
      currentRoundId: currentRound.id,
      userId: user.id,
    });
  }, [user.id, currentRound]);

  const vote = useCallback(async (definitionId: string) => {
    if (!currentRound?.id) {
      throw new Error('Nenhuma rodada ativa');
    }
    
    const isRealWord = currentRound.word.id === definitionId;
    
    await gameActions.addVote({
      currentRoundId: currentRound.id,
      roomCode: code,
      userId: user.id,
      definitionId: isRealWord ? null : definitionId,
      isRealWord,
    });
  }, [code, user.id, currentRound]);

  const removeVote = useCallback(async () => {
    if (!currentRound?.id) {
      throw new Error('Nenhuma rodada ativa');
    }
    
    await gameActions.removeVote({
      currentRoundId: currentRound.id,
      userId: user.id,
    });
  }, [user.id, currentRound]);

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
      currentRoundPoints,
      configs,
      isLoading,
      refetchAll,
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
