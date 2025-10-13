"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { roomService } from "@/server/services/room";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Player, RoomUser } from "@/types/user";
import { RoomComplete } from "@/types/room";
import { GameConfig, GameStage } from "@/types/game";
import { useRouter } from "next/navigation";
import { addToast } from "@heroui/react";
import { useSessionOptional } from "./SessionContext";

type RoomChannelContextValue = {
  code: string;
  hostId: string;
  channel: RealtimeChannel | null;
  onlinePlayers: Player[];
  amIHost: boolean;
  amIConnected: boolean;
  configs: GameConfig;
  lastEventTime: number;
  setRefetchGame: (fn: () => void) => void;
  setUpdateStage: (fn: (stage: GameStage) => void) => void;
  setUpdatePlayers: (fn: (playerData: Record<string, unknown>) => void) => void;
  setUpdateCurrentRound: (fn: () => void) => void;
  setUpdateVotes: (fn: (voteData: Record<string, unknown>, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) => void;
  setActivateGame: (fn: () => void) => void;
  kickPlayer: (playerId: string) => void;
};

function lastMeta(arr: RoomUser[]) {
  return arr[arr.length - 1];
}

const RoomChannelContext = createContext<RoomChannelContextValue | null>(null);

type Props = PropsWithChildren & {
  room: RoomComplete;
};

function RoomChannelProvider({ children, room }: Props) {
  const router = useRouter();
  const { user } = useSessionOptional();

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [hostId, setHostId] = useState(room.host.id);
  const [onlinePlayers, setOnlinePlayers] = useState<RoomUser[]>([]);
  const [lastEventTime, setLastEventTime] = useState(Date.now());

  const refetchGameRef = useRef<(() => void) | null>(null);
  const updateStageRef = useRef<((stage: GameStage) => void) | null>(null);
  const updatePlayersRef = useRef<((playerData: Record<string, unknown>) => void) | null>(null);
  const updateCurrentRoundRef = useRef<(() => void) | null>(null);
  const updateVotesRef = useRef<((voteData: Record<string, unknown>, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) | null>(null);
  const activateGameRef = useRef<(() => void) | null>(null);

  const configs = room.configs as GameConfig;
  const amIConnected = user ? onlinePlayers.some(u => u.id === user.id) : false;
  const canIJoinTheRoom = !room.session || room.session.players.some(p => p.id === user?.id);

  const onGameStateChange = useCallback(() => {
    setLastEventTime(Date.now());
  }, []);

  useEffect(() => {
    // Conecta automaticamente caso:
    // - O usuário esteja logado; E
    // - O jogo ainda ainda não começou ou ele já esteja participando do jogo
    if (!user || !canIJoinTheRoom) return;

    const roomChannel = roomService.joinRoomChannel({ code: room.code, user });

    roomChannel
      .on("presence", { event: "sync" }, async () => {
        const raw = roomChannel.presenceState() as Record<string, RoomUser[]>;
        const players = Object.values(raw).map(lastMeta);
        setOnlinePlayers(players);
      })
      .on("broadcast", { event: "kick" }, ({ payload }) => {
        if (payload.userId === user.id) {
          addToast({
            title: "Você foi expulso da sala",
            color: "danger",
          });

          roomChannel.unsubscribe();
          router.push('/');
        }
      })
      .on(
        "postgres_changes",
        { schema: 'public', event: 'UPDATE', table: 'rooms', filter: `code=eq.${room.code}` },
        (payload) => { setHostId(payload.new.host_user_id) }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: 'INSERT', table: 'game_sessions', filter: `room_code=eq.${room.code}` },
        () => {
          // Quando uma sessão de jogo é criada, ativa o GameContext
          activateGameRef.current?.();
          onGameStateChange();
        }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: '*', table: 'game_sessions', filter: `room_code=eq.${room.code}` },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new?.stage) {
            const newStage = payload.new.stage as GameStage;
            updateStageRef.current?.(newStage);

            if (newStage === 'vote' || newStage === 'blame') {
              updateCurrentRoundRef.current?.();
            }
          } else {
            refetchGameRef.current?.();
          }
          onGameStateChange();
        }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: '*', table: 'game_players', filter: `room_code=eq.${room.code}` },
        (payload) => {
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            updatePlayersRef.current?.(payload.new as Record<string, unknown>);
          } else {
            refetchGameRef.current?.();
          }
          onGameStateChange();
        }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: '*', table: 'game_rounds', filter: `room_code=eq.${room.code}` },
        () => {
          updateCurrentRoundRef.current?.();
          onGameStateChange();
        }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: '*', table: 'game_fake_definitions', filter: `room_code=eq.${room.code}` },
        () => {
          updateCurrentRoundRef.current?.();
          onGameStateChange();
        }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: '*', table: 'game_votes', filter: `room_code=eq.${room.code}` },
        (payload) => {
          const voteData = payload.eventType === 'DELETE' ? payload.old : payload.new;

          if (voteData) {
            updateVotesRef.current?.(voteData as Record<string, unknown>, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
          } else {
            refetchGameRef.current?.();
          }
          onGameStateChange();
        }
      )
      .subscribe(async (status, err) => {
        if (err) {
          // setConnectionStatus('disconnected');
          return;
        }

        if (status === "SUBSCRIBED") {
          // setConnectionStatus('connected');
          await roomChannel.track({
            ...user,
            onlineAt: new Date().toISOString(),
          });
        } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
          // setConnectionStatus('disconnected');
        }
      });


    setChannel(roomChannel);

    return () => {
      roomChannel?.unsubscribe();
    };
  }, [room.code, user, onGameStateChange, router, canIJoinTheRoom]);

  const setActivateGameCallback = useCallback((fn: () => void) => {
    activateGameRef.current = fn;
  }, []);

  const setRefetchGameCallback = useCallback((fn: () => void) => {
    refetchGameRef.current = fn;
  }, []);

  const setUpdateStageCallback = useCallback((fn: (stage: GameStage) => void) => {
    updateStageRef.current = fn;
  }, []);

  const setUpdatePlayersCallback = useCallback((fn: (playerData: Record<string, unknown>) => void) => {
    updatePlayersRef.current = fn;
  }, []);

  const setUpdateCurrentRoundCallback = useCallback((fn: () => void) => {
    updateCurrentRoundRef.current = fn;
  }, []);

  const setUpdateVotesCallback = useCallback((fn: (voteData: Record<string, unknown>, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) => {
    updateVotesRef.current = fn;
  }, []);

  const kickPlayer = useCallback((playerId: string) => {
    if (!channel || !user || user.id !== hostId) {
      return;
    }

    channel.send({
      type: "broadcast",
      event: "kick",
      payload: { userId: playerId },
    });
  }, [channel, user, hostId]);

  const value = useMemo(
    () => ({
      code: room.code,
      hostId,
      channel,
      onlinePlayers: onlinePlayers.map(u => ({ ...u, isHost: u.id === hostId })),
      amIHost: user ? user.id === hostId : false,
      amIConnected,
      configs,
      lastEventTime,
      setRefetchGame: setRefetchGameCallback,
      setUpdateStage: setUpdateStageCallback,
      setUpdatePlayers: setUpdatePlayersCallback,
      setUpdateCurrentRound: setUpdateCurrentRoundCallback,
      setUpdateVotes: setUpdateVotesCallback,
      setActivateGame: setActivateGameCallback,
      kickPlayer,
    }),
    [room.code, hostId, channel, onlinePlayers, user, amIConnected, configs, lastEventTime, setRefetchGameCallback, setUpdateStageCallback, setUpdatePlayersCallback, setUpdateCurrentRoundCallback, setUpdateVotesCallback, setActivateGameCallback, kickPlayer]
  );

  return <RoomChannelContext.Provider value={value}>{children}</RoomChannelContext.Provider>;
}

// Hook seguro - pode retornar null
function useRoomChannelSafe() {
  return useContext(RoomChannelContext);
}

// Hook que garante contexto - throw error se não existir
function useRoomChannel() {
  const context = useContext(RoomChannelContext);
  if (!context) {
    throw new Error('useRoomChannelContext must be used within RoomChannelProvider');
  }
  return context;
}

export { RoomChannelProvider, useRoomChannelSafe, useRoomChannel };
