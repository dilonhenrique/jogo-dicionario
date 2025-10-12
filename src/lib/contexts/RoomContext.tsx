"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { roomService } from "@/server/services/room";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Player, RoomUser } from "@/types/user";
import { useSession } from "./SessionContext";
import { Room } from "@/types/room";
import { ConnectionStatus, GameConfig } from "@/types/game";
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
  onGameStateChange: () => void;
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

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [hostId, setHostId] = useState(room.host.id);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [gameHasStarted, setGameStarted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [gameStateChangeCounter, setGameStateChangeCounter] = useState(0);

  const configs = room.configs as GameConfig;
  const amIConnected = users.some(u => u.id === user.id);

  const onGameStateChange = () => {
    setGameStateChangeCounter(prev => prev + 1);
  };

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
      .on(
        "postgres_changes",
        { schema: 'public', event: 'UPDATE', table: 'game_sessions', filter: `room_code=eq.${room.code}` },
        () => {
          serverLog('🔄 game_sessions atualizada');
          onGameStateChange();
        }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: '*', table: 'game_players', filter: `room_code=eq.${room.code}` },
        () => {
          serverLog('🔄 game_players atualizada');
          onGameStateChange();
        }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: '*', table: 'game_rounds' },
        (payload) => {
          if (payload.new && 'room_code' in payload.new && payload.new.room_code === room.code) {
            serverLog('🔄 game_rounds atualizada');
            onGameStateChange();
          }
        }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: '*', table: 'game_fake_definitions' },
        () => {
          serverLog('🔄 game_fake_definitions atualizada');
          onGameStateChange();
        }
      )
      .on(
        "postgres_changes",
        { schema: 'public', event: '*', table: 'game_votes' },
        () => {
          serverLog('🔄 game_votes atualizada');
          onGameStateChange();
        }
      )
      .subscribe(async (status, err) => {
        if (err) {
          serverLog('Erro no channel:', err);
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
      onGameStateChange,
      startGame,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [room.code, hostId, channel, users, gameHasStarted, user.id, amIConnected, configs, connectionStatus, gameStateChangeCounter]
  );

  return <RoomChannelContext.Provider value={value}>{children}</RoomChannelContext.Provider>;
}

function useRoomChannel() {
  return useContext(RoomChannelContext);
}

export { RoomChannelProvider, useRoomChannel };
