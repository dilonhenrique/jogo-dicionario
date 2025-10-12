"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { roomService } from "@/server/services/room";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Player, RoomUser } from "@/types/user";
import { useSession } from "./SessionContext";
import { RoomComplete } from "@/types/room";
import { ConnectionStatus, GameConfig, GameStage } from "@/types/game";
import { useRouter } from "next/navigation";
import { addToast } from "@heroui/react";

type RoomChannelContextValue = {
  code: string;
  hostId: string;
  channel: RealtimeChannel;
  onlinePlayers: Player[];
  gameHasStarted: boolean;
  amIHost: boolean;
  amIConnected: boolean;
  configs: GameConfig;
  connectionStatus: ConnectionStatus;
  lastEventTime: number;
  startGame: () => void;
  setRefetchGame: (fn: () => void) => void;
  setUpdateStage: (fn: (stage: GameStage) => void) => void;
  setUpdatePlayers: (fn: (playerData: Record<string, unknown>) => void) => void;
  setUpdateCurrentRound: (fn: () => void) => void;
  setUpdateVotes: (fn: (voteData: Record<string, unknown>, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) => void;
  kickPlayer: (playerId: string) => void;
};

function lastMeta(arr: RoomUser[]) {
  return arr[arr.length - 1];
}

const RoomChannelContext = createContext<RoomChannelContextValue>({} as RoomChannelContextValue);

type Props = PropsWithChildren & {
  room: RoomComplete;
};

function RoomChannelProvider({ children, room }: Props) {
  const { user } = useSession();
  const router = useRouter();

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [hostId, setHostId] = useState(room.host.id);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [gameHasStarted, setGameStarted] = useState(!!room.session);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [lastEventTime, setLastEventTime] = useState(Date.now());

  const refetchGameRef = useRef<(() => void) | null>(null);
  const updateStageRef = useRef<((stage: GameStage) => void) | null>(null);
  const updatePlayersRef = useRef<((playerData: Record<string, unknown>) => void) | null>(null);
  const updateCurrentRoundRef = useRef<(() => void) | null>(null);
  const updateVotesRef = useRef<((voteData: Record<string, unknown>, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) | null>(null);

  const configs = room.configs as GameConfig;
  const amIConnected = users.some(u => u.id === user.id);

  const onGameStateChange = useCallback(() => {
    setLastEventTime(Date.now());
  }, []);

  useEffect(() => {
    const roomChannel = roomService.joinRoomChannel({ code: room.code, user });

    roomChannel
      .on("presence", { event: "sync" }, async () => {
        const raw = roomChannel.presenceState() as Record<string, RoomUser[]>;
        const players = Object.values(raw).map(lastMeta);
        setUsers(players);
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
        { schema: 'public', event: '*', table: 'game_sessions', filter: `room_code=eq.${room.code}` },
        () => {
          refetchGameRef.current?.();
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
          setConnectionStatus('disconnected');
          return;
        }

        if (status === "SUBSCRIBED") {
          setConnectionStatus('connected');
          await roomChannel.track({
            ...user,
            onlineAt: new Date().toISOString(),
          });
        } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
          setConnectionStatus('disconnected');
        }
      });


    setChannel(roomChannel);

    return () => {
      roomChannel?.unsubscribe();
    };
  }, [room.code, user, onGameStateChange, router]);

  useEffect(() => {
    if (!gameHasStarted) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetchGameRef.current?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameHasStarted]);

  useEffect(() => {
    if (!gameHasStarted) return;

    const pollInterval = setInterval(() => {
      const timeSinceLastEvent = Date.now() - lastEventTime;

      if (timeSinceLastEvent > 10000 && !document.hidden) {
        refetchGameRef.current?.();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [gameHasStarted, lastEventTime]);

  const startGame = () => {
    setGameStarted(true);
  };

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
    if (!channel || user.id !== hostId) {
      return;
    }

    channel.send({
      type: "broadcast",
      event: "kick",
      payload: { userId: playerId },
    });
  }, [channel, user.id, hostId]);

  const value = useMemo(
    () => ({
      code: room.code,
      hostId,
      channel: channel!,
      onlinePlayers: users.map(u => ({ ...u, isHost: u.id === hostId })),
      gameHasStarted,
      amIHost: user.id === hostId,
      amIConnected,
      configs,
      connectionStatus,
      lastEventTime,
      startGame,
      setRefetchGame: setRefetchGameCallback,
      setUpdateStage: setUpdateStageCallback,
      setUpdatePlayers: setUpdatePlayersCallback,
      setUpdateCurrentRound: setUpdateCurrentRoundCallback,
      setUpdateVotes: setUpdateVotesCallback,
      kickPlayer,
    }),
    [room.code, hostId, channel, users, gameHasStarted, user.id, amIConnected, configs, connectionStatus, lastEventTime, setRefetchGameCallback, setUpdateStageCallback, setUpdatePlayersCallback, setUpdateCurrentRoundCallback, setUpdateVotesCallback, kickPlayer]
  );

  return <RoomChannelContext.Provider value={value}>{children}</RoomChannelContext.Provider>;
}

function useRoomChannel() {
  return useContext(RoomChannelContext);
}

export { RoomChannelProvider, useRoomChannel };
