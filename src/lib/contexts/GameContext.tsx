"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GameVotes, SimpleWord } from "@/types/game";
import { useRoomChannel } from "./RoomContext";
import { useSessionOptional } from "./SessionContext";
import { useGameSync } from "../hooks/useGameSync";
import { gameActions } from "@/server/actions/game";
import { GameContextValue } from "./GameContext.types";

const GameContext = createContext<GameContextValue>({} as GameContextValue);

type Props = PropsWithChildren & {
  roomCode: string;
}

function GameProvider({ children, roomCode }: Props) {
  const { user: sessionUser } = useSessionOptional();
  const user = sessionUser!;

  const roomChannel = useRoomChannel();
  const [isActive, setIsActive] = useState(false);

  const {
    onlinePlayers,
    configs,
    setRefetchGame,
    setUpdateStage,
    setUpdatePlayers,
    setUpdateCurrentRound,
    setUpdateVotes,
    setStartGame: setActivateGame,
    lastEventTime,
  } = roomChannel;

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
  } = useGameSync(roomCode);

  const votes: GameVotes = votesMap as GameVotes;

  const start = useCallback(() => {
    setIsActive(true);
  }, []);

  useEffect(() => {
    setActivateGame(start);
  }, [start, setActivateGame]);

  const players = useMemo(() => {
    if (!isActive) return [];
    return gamePlayers.map(p => {
      const onlinePlayer = onlinePlayers.find(op => op.id === p.id);
      return {
        ...p,
        onlineAt: onlinePlayer?.onlineAt || null,
        isHost: onlinePlayer?.isHost || false,
      };
    });
  }, [gamePlayers, onlinePlayers, isActive]);

  useEffect(() => {
    if (!isActive) return;
    setRefetchGame(refetchAll);
  }, [refetchAll, setRefetchGame, isActive]);

  useEffect(() => {
    if (!isActive) return;
    setUpdateStage(updateStageFromPayload);
    setUpdatePlayers(updatePlayersFromPayload);
    setUpdateCurrentRound(updateCurrentRoundFromPayload);
    setUpdateVotes(updateVotesFromPayload);
  }, [setUpdateStage, setUpdatePlayers, setUpdateCurrentRound, setUpdateVotes, updateStageFromPayload, updatePlayersFromPayload, updateCurrentRoundFromPayload, updateVotesFromPayload, isActive]);

  useEffect(() => {
    if (!isActive) return;
    if (stage === 'blame') {
      refetchCurrentRoundPoints();
    }
  }, [stage, refetchCurrentRoundPoints, isActive]);

  // Polling e visibility change para refetch
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetchAll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, refetchAll]);

  useEffect(() => {
    if (!isActive) return;

    const pollInterval = setInterval(() => {
      const timeSinceLastEvent = Date.now() - lastEventTime;

      if (timeSinceLastEvent > 10000 && !document.hidden) {
        refetchAll();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isActive, lastEventTime, refetchAll]);

  const setWordAndStartFakeStage = useCallback(async (word: SimpleWord) => {
    await gameActions.setWordAndStartFake({
      roomCode,
      word,
    });
  }, [roomCode]);

  const addFakeWord = useCallback(async (definition: string) => {
    if (!currentRound?.id) {
      throw new Error('Nenhuma rodada ativa');
    }

    await gameActions.addFakeDefinition({
      currentRoundId: currentRound.id,
      roomCode,
      userId: user.id,
      definition,
    });
  }, [roomCode, user?.id, currentRound]);

  const removeFakeWord = useCallback(async () => {
    if (!currentRound?.id) {
      throw new Error('Nenhuma rodada ativa');
    }

    await gameActions.removeFakeDefinition({
      currentRoundId: currentRound.id,
      userId: user?.id,
    });
  }, [user?.id, currentRound]);

  const vote = useCallback(async (definitionId: string) => {
    if (!currentRound?.id) {
      throw new Error('Nenhuma rodada ativa');
    }

    const isRealWord = currentRound.word.id === definitionId;

    await gameActions.addVote({
      currentRoundId: currentRound.id,
      roomCode,
      userId: user?.id,
      definitionId: isRealWord ? null : definitionId,
      isRealWord,
    });
  }, [roomCode, user?.id, currentRound]);

  const removeVote = useCallback(async () => {
    if (!currentRound?.id) {
      throw new Error('Nenhuma rodada ativa');
    }

    await gameActions.removeVote({
      currentRoundId: currentRound.id,
      userId: user?.id,
    });
  }, [user?.id, currentRound]);

  const checkoutCurrentRound = useCallback(async () => {
    await gameActions.checkoutRound({
      roomCode,
      configs,
    });
  }, [roomCode, configs]);

  const restartGameAction = useCallback(async () => {
    await gameActions.restartGame({
      roomCode,
      configs,
    });
  }, [roomCode, configs]);

  const kickPlayerAction = useCallback(async (userId: string) => {
    await gameActions.kickPlayer({
      roomCode,
      userId,
    });
  }, [roomCode]);

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
    value={
      isActive ? {
        hasStarted: true,
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
      } : {
        hasStarted: false,
        start,
      }
    }
  >
    {children}
  </GameContext.Provider>)
}

// Hook seguro - pode retornar null
function useGameSafe() {
  return useContext(GameContext);
}

// Hook que garante contexto - throw error se não existir
function useGame() {
  const context = useContext(GameContext);

  if (!context.hasStarted) {
    throw new Error('useGameContext must be used within active GameProvider');
  }

  return context;
}

export { GameProvider, useGameSafe, useGame }
