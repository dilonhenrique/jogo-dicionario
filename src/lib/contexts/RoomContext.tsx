"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { joinRoomChannel } from "@/server/services/room/room.service";
import { findByCode } from "@/server/services/room/room.service";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Player } from "@/types/user";
import { useLatest } from "../hooks/useLatest";
import { useSession } from "./SessionContext";

type RoomChannelContextValue = {
  code: string;
  channel: RealtimeChannel;
  onlinePlayers: Player[];
  gameHasStarted: boolean;
  amIConnected: boolean;
  startGame: () => void;
};

function lastMeta(arr: Player[]) {
  return arr[arr.length - 1];
}

const RoomChannelContext = createContext<RoomChannelContextValue>({} as RoomChannelContextValue);

type Props = PropsWithChildren & {
  code: string;
};

function RoomChannelProvider({ children, code }: Props) {
  const { user, updateUser } = useSession();

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [onlinePlayers, setPlayers] = useState<Player[]>([]);
  const [gameHasStarted, setGameStarted] = useState(false);

  const amIConnected = useMemo(() => onlinePlayers.some(u => u.id === user.id), [onlinePlayers, user.id]);

  const latestIsHost = useLatest(user.isHost);
  const latestUserId = useLatest(user.id);

  useEffect(() => {
    const roomChannel = joinRoomChannel({ code, user });

    roomChannel
      .on("presence", { event: "sync" }, async () => {
        const raw = roomChannel.presenceState() as Record<string, Player[]>;
        const players = Object.values(raw).map(lastMeta);
        setPlayers(players);

        try {
          const room = await findByCode(code);
          if (!room) {
            console.warn("Sala não encontrada no banco de dados");
            return;
          }

          const hostUserId = room.host.id;
          const iAmHostNow = hostUserId === latestUserId.current;

          if (latestIsHost.current !== iAmHostNow) {
            latestIsHost.current = iAmHostNow;
            updateUser({ isHost: iAmHostNow });

            await roomChannel.track({
              ...user,
              onlineAt: new Date().toISOString(),
              isHost: iAmHostNow,
            });
          }
        } catch (error) {
          console.error("Erro ao verificar sala/sessão:", error);
        }
      })
      .on("broadcast", { event: "host-transferred" }, ({ payload }) => {
        const iAmHostNow = payload.newHostId === latestUserId.current;
        if (latestIsHost.current !== iAmHostNow) {
          latestIsHost.current = iAmHostNow;
          updateUser({ isHost: iAmHostNow });
        }
      });

    setChannel(roomChannel);

    return () => {
      roomChannel?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const startGame = () => {
    setGameStarted(true);
  };

  const value = useMemo(
    () => ({
      code,
      channel: channel!,
      onlinePlayers,
      gameHasStarted,
      amIConnected,
      startGame,
    }),
    [code, onlinePlayers, gameHasStarted, channel, amIConnected]
  );

  return <RoomChannelContext.Provider value={value}>{children}</RoomChannelContext.Provider>;
}

function useRoomChannel() {
  return useContext(RoomChannelContext);
}

export { RoomChannelProvider, useRoomChannel };
