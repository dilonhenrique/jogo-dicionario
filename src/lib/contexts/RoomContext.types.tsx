"use client";

import { RealtimeChannel } from "@supabase/supabase-js";
import { Player } from "@/types/user";
import { GameConfig, GameStage } from "@/types/game";

export type RoomChannelContextValueIntegration = {
  setRefetchGame: (fn: () => void) => void;
  setUpdateStage: (fn: (stage: GameStage) => void) => void;
  setUpdatePlayers: (fn: (playerData: Record<string, unknown>) => void) => void;
  setUpdateCurrentRound: (fn: () => void) => void;
  setUpdateVotes: (fn: (voteData: Record<string, unknown>, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) => void;
  setStartGame: (fn: () => void) => void;
}

export type RoomChannelContextValue = {
  code: string;
  hostId: string;
  channel: RealtimeChannel | null;
  onlinePlayers: Player[];
  amIHost: boolean;
  amIConnected: boolean;
  configs: GameConfig;
  lastEventTime: number;
  kickPlayer: (playerId: string) => void;
};

export type RoomChannelContextValueComplete = RoomChannelContextValue & RoomChannelContextValueIntegration;
