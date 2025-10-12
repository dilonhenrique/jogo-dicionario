"use client";

import { useCallback, useEffect, useState } from "react";
import { GameStage, WordRound } from "@/types/game";
import { GamePlayer } from "@/types/user";
import { gameService } from "@/server/services/game";
import { calculateRoundPoints } from "@/lib/utils/calculateRoundPoints";
import { serverLog } from "@/lib/utils/serverLog";

export type UseGameSyncReturn = {
  stage: GameStage;
  players: GamePlayer[];
  currentRound: WordRound | null;
  roundHistory: WordRound[];
  votes: Map<string, string>;
  currentRoundPoints: Map<string, number>;
  isLoading: boolean;
  refetchAll: () => Promise<void>;
  refetchStage: () => Promise<void>;
  refetchPlayers: () => Promise<void>;
  refetchCurrentRound: () => Promise<void>;
  refetchVotes: () => Promise<void>;
  refetchCurrentRoundPoints: () => void;
  updateStageFromPayload: (newStage: GameStage) => void;
  updatePlayersFromPayload: (playerData: Record<string, unknown>) => void;
  updateCurrentRoundFromPayload: () => void;
  updateVotesFromPayload: (voteData: Record<string, unknown>, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
};

export function useGameSync(roomCode: string): UseGameSyncReturn {
  const [stage, setStage] = useState<GameStage>("word_pick");
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [currentRound, setCurrentRound] = useState<WordRound | null>(null);
  const [roundHistory, setRoundHistory] = useState<WordRound[]>([]);
  const [votes, setVotes] = useState<Map<string, string>>(new Map());
  const [currentRoundPoints, setCurrentRoundPoints] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const refetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const state = await gameService.getState(roomCode);
      
      if (state === null) {
        return;
      }
      
      setStage(state.stage);
      setPlayers(state.players);
      setCurrentRound(state.currentRound);
      setRoundHistory(state.roundHistory);
      setVotes(state.votes);
    } catch (error) {
      console.error("Erro ao buscar estado do jogo:", error);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode]);

  const refetchStage = useCallback(async () => {
    try {
      const state = await gameService.getState(roomCode);
      if (state) {
        setStage(state.stage);
      }
    } catch (error) {
      console.error("Erro ao buscar stage:", error);
    }
  }, [roomCode]);

  const refetchPlayers = useCallback(async () => {
    try {
      const playersData = await gameService.getPlayers(roomCode);
      setPlayers(playersData);
    } catch (error) {
      console.error("Erro ao buscar jogadores:", error);
    }
  }, [roomCode]);

  const refetchCurrentRound = useCallback(async () => {
    try {
      const round = await gameService.getCurrentRound(roomCode);
      setCurrentRound(round);
    } catch (error) {
      console.error("Erro ao buscar rodada atual:", error);
    }
  }, [roomCode]);

  const refetchVotes = useCallback(async () => {
    try {
      const votesData = await gameService.getVotes(roomCode);
      setVotes(votesData);
    } catch (error) {
      console.error("Erro ao buscar votos:", error);
    }
  }, [roomCode]);

  const refetchCurrentRoundPoints = useCallback(() => {
    // Calcula localmente - sem requisição!
    const pointsMap = calculateRoundPoints(votes, currentRound);
    setCurrentRoundPoints(pointsMap);
  }, [votes, currentRound]);

  // Funções de atualização incremental a partir de payloads do Supabase
  const updateStageFromPayload = useCallback((newStage: GameStage) => {
    setStage(newStage);
  }, []);

  const updatePlayersFromPayload = useCallback((playerData: Record<string, unknown>) => {
    const playerId = playerData.user_id as string;
    const playerName = playerData.user_name as string;
    const playerPoints = playerData.points as number;

    setPlayers(prev => {
      const existingIndex = prev.findIndex(p => p.id === playerId);
      const updatedPlayer: GamePlayer = {
        id: playerId,
        name: playerName,
        points: playerPoints,
        isHost: false, // Será preenchido no GameContext
        onlineAt: null, // Será preenchido no GameContext
      };

      if (existingIndex >= 0) {
        const newPlayers = [...prev];
        newPlayers[existingIndex] = updatedPlayer;
        return newPlayers;
      } else {
        return [...prev, updatedPlayer];
      }
    });
  }, []);

  const updateCurrentRoundFromPayload = useCallback(() => {
    // Para rounds, é mais complexo pois precisa das fakes
    // Neste caso, melhor fazer refetch completo
    refetchCurrentRound();
  }, [refetchCurrentRound]);

  const updateVotesFromPayload = useCallback((voteData: Record<string, unknown>, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => {
    const userId = voteData.user_id as string;
    const definitionId = voteData.definition_id as string | null;
    
    setVotes(prev => {
      const newVotes = new Map(prev);
      
      if (eventType === 'DELETE') {
        newVotes.delete(userId);
      } else {
        // INSERT ou UPDATE
        if (definitionId) {
          newVotes.set(userId, definitionId);
        } else {
          // Votou na palavra real - usa id da rodada atual
          const wordId = currentRound?.word?.id;
          if (wordId) {
            newVotes.set(userId, wordId);
          } else {
            // Se não tiver rodada atual, não altera
            serverLog("updateVotesFromPayload: No currentRound.word.id available");
            return prev;
          }
        }
      }
      
      return newVotes;
    });
  }, [currentRound]);

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  return {
    stage,
    players,
    currentRound,
    roundHistory,
    votes,
    currentRoundPoints,
    isLoading,
    refetchAll,
    refetchStage,
    refetchPlayers,
    refetchCurrentRound,
    refetchVotes,
    refetchCurrentRoundPoints,
    updateStageFromPayload,
    updatePlayersFromPayload,
    updateCurrentRoundFromPayload,
    updateVotesFromPayload,
  };
}
