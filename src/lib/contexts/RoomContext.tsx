"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { roomService } from "@/server/services/room";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Player, RoomUser } from "@/types/user";
import { useSession } from "./SessionContext";
import { Room } from "@/types/room";
import { ConnectionStatus, GameConfig } from "@/types/game";
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
  gameStateChangeCounter: number;
  startGame: () => void;
  setRefetchGame: (fn: () => void) => void;
  kickPlayer: (playerId: string) => void;
};

function lastMeta(arr: RoomUser[]) {
  return arr[arr.length - 1];
}

const RoomChannelContext = createContext<RoomChannelContextValue>({} as RoomChannelContextValue);

type Props = PropsWithChildren & {
  room: Room;
};

function RoomChannelProvider({ children, room }: Props) {
  const { user } = useSession();
  const router = useRouter();

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [hostId, setHostId] = useState(room.host.id);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [gameHasStarted, setGameStarted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [gameStateChangeCounter, setGameStateChangeCounter] = useState(0);

  const refetchGameRef = useRef<(() => void) | null>(null);

  const configs = room.configs as GameConfig;
  const amIConnected = users.some(u => u.id === user.id);

  const onGameStateChange = useCallback(() => {
    setGameStateChangeCounter(prev => prev + 1);
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
        { schema: 'public', event: '*', table: 'game_players', filter: `room_code=eq.${room.code}` },
        () => {
          refetchGameRef.current?.();
          onGameStateChange();
        }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: '*', table: 'game_rounds', filter: `room_code=eq.${room.code}` },
        () => {
          refetchGameRef.current?.();
          onGameStateChange();
        }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: '*', table: 'game_fake_definitions', filter: `room_code=eq.${room.code}` },
        () => {
          refetchGameRef.current?.();
        }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: '*', table: 'game_votes', filter: `room_code=eq.${room.code}` },
        () => {
          refetchGameRef.current?.();
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

  const startGame = () => {
    setGameStarted(true);
  };

  const setRefetchGameCallback = useCallback((fn: () => void) => {
    refetchGameRef.current = fn;
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
      gameStateChangeCounter,
      startGame,
      setRefetchGame: setRefetchGameCallback,
      kickPlayer,
    }),
    [room.code, hostId, channel, users, gameHasStarted, user.id, amIConnected, configs, connectionStatus, gameStateChangeCounter, setRefetchGameCallback, kickPlayer]
  );

  return <RoomChannelContext.Provider value={value}>{children}</RoomChannelContext.Provider>;
}

function useRoomChannel() {
  return useContext(RoomChannelContext);
}

export { RoomChannelProvider, useRoomChannel };
