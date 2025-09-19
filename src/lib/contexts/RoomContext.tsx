"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { roomService } from "@/server/services/room";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Player, RoomUser } from "@/types/user";
import { useSession } from "./SessionContext";
import { Room } from "@/types/room";
import { GameConfig } from "@/types/game";

type RoomChannelContextValue = {
  code: string;
  hostId: string;
  channel: RealtimeChannel;
  onlinePlayers: Player[];
  gameHasStarted: boolean;
  amIHost: boolean;
  amIConnected: boolean;
  configs: GameConfig;
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
      // .on(
      //   "postgres_changes",
      //   { schema: 'public', event: '*', table: 'game_sessions', filter: `room_code=eq.${room.code}` },
      //   (payload) => { console.log(payload) }
      // )
      .subscribe(async (status, err) => {
        if (err) console.error(err);

        if (status === "SUBSCRIBED") {
          await roomChannel.track({
            ...user,
            onlineAt: new Date().toISOString(),
          });
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
      startGame,
    }),
    [room.code, hostId, users, gameHasStarted, channel, amIConnected, configs, user.id]
  );

  return <RoomChannelContext.Provider value={value}>{children}</RoomChannelContext.Provider>;
}

function useRoomChannel() {
  return useContext(RoomChannelContext);
}

export { RoomChannelProvider, useRoomChannel };
