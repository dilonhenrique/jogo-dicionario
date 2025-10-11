"use client";

import { useCallback, useEffect, useState } from "react";
import { GameStage, WordRound } from "@/types/game";
import { GamePlayer } from "@/types/user";
import { gameService } from "@/server/services/game";

export type UseGameSyncReturn = {
  stage: GameStage;
  players: GamePlayer[];
  currentRound: WordRound | null;
  roundHistory: WordRound[];
  votes: Map<string, string>;
  isLoading: boolean;
  refetchAll: () => Promise<void>;
  refetchStage: () => Promise<void>;
  refetchPlayers: () => Promise<void>;
  refetchCurrentRound: () => Promise<void>;
  refetchVotes: () => Promise<void>;
};

export function useGameSync(roomCode: string): UseGameSyncReturn {
  const [stage, setStage] = useState<GameStage>("word_pick");
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [currentRound, setCurrentRound] = useState<WordRound | null>(null);
  const [roundHistory, setRoundHistory] = useState<WordRound[]>([]);
  const [votes, setVotes] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const refetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const state = await gameService.getState(roomCode);
      
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
      setStage(state.stage);
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

  // Fetch inicial
  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  return {
    stage,
    players,
    currentRound,
    roundHistory,
    votes,
    isLoading,
    refetchAll,
    refetchStage,
    refetchPlayers,
    refetchCurrentRound,
    refetchVotes,
  };
}
