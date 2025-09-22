"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState, RefObject } from "react";
import { roomService } from "@/server/services/room";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Player, RoomUser } from "@/types/user";
import { useSession } from "./SessionContext";
import { Room } from "@/types/room";
import { ConnectionStatus, GameConfig, GameState } from "@/types/game";
import useSyncGame from "../hooks/useSyncGame";
import { serverLog } from "../utils/serverLog";

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
  updateGameState: RefObject<(state: GameState) => void>
  startGame: () => void;
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
  const { connectionStatus, setConnectionStatus, updateGameState } = useSyncGame(room.code);

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [hostId, setHostId] = useState(room.host.id);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [gameHasStarted, setGameStarted] = useState(false);

  const configs = room.configs as GameConfig;
  const amIConnected = users.some(u => u.id === user.id);

  useEffect(() => {
    const roomChannel = roomService.joinRoomChannel({ code: room.code, user });

    roomChannel
      .on("presence", { event: "sync" }, async () => {
        const raw = roomChannel.presenceState() as Record<string, RoomUser[]>;
        const players = Object.values(raw).map(lastMeta);
        setUsers(players);
      })
      .on(
        "postgres_changes",
        { schema: 'public', event: 'UPDATE', table: 'rooms', filter: `code=eq.${room.code}` },
        (payload) => { setHostId(payload.new.host_user_id) }
      )
      .subscribe(async (status, err) => {
        if (err) {
          console.error('Erro no channel:', err);
          setConnectionStatus('disconnected');
          return;
        }

        serverLog('📡 Status do channel:', status);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.code]);

  const startGame = () => {
    setGameStarted(true);
  };

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
      updateGameState,
      startGame,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [room.code, hostId, channel, users, gameHasStarted, user.id, amIConnected, configs, connectionStatus]
  );

  return <RoomChannelContext.Provider value={value}>{children}</RoomChannelContext.Provider>;
}

function useRoomChannel() {
  return useContext(RoomChannelContext);
}

export { RoomChannelProvider, useRoomChannel };
