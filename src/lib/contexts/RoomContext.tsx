"use client";

import { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { joinRoomChannel } from "@/server/services/room/room.service";
import { findByCode } from "@/server/services/room/room.service";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Player, User } from "@/types/user";
import { useLatest } from "../hooks/useLatest";

type RoomChannelContextValue = {
  code: string;
  channel: RealtimeChannel;
  onlinePlayers: Player[];
  currentUser: User;
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
  user: User;
  setUser: Dispatch<SetStateAction<User>>;
};

function RoomChannelProvider({ children, code, user, setUser }: Props) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const [onlinePlayers, setPlayers] = useState<Player[]>([]);
  const [gameHasStarted, setGameStarted] = useState(false);

  const amIConnected = useMemo(() => onlinePlayers.some(u => u.id === user.id), [onlinePlayers, user.id]);

  const latestIsHost = useLatest(user.isHost);

  useLayoutEffect(() => {
    setChannel(joinRoomChannel({ code, user }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    channel
      ?.on("presence", { event: "sync" }, async () => {
        const raw = channel.presenceState() as Record<string, Player[]>;
        const players = Object.values(raw).map(lastMeta);
        setPlayers(players);

        try {
          const room = await findByCode(code);
          if (!room) {
            console.warn("Sala não encontrada no banco de dados");
            return;
          }

          const hostUserId = room.host.id;
          const iAmHostNow = hostUserId === user.id;

          if (latestIsHost.current !== iAmHostNow) {
            latestIsHost.current = iAmHostNow;
            setUser(u => ({ ...u, isHost: iAmHostNow }));
          }

          if (iAmHostNow) {
            await channel.track({
              ...user,
              onlineAt: new Date().toISOString(),
              isHost: true,
            });
          }
        } catch (error) {
          console.error("Erro ao verificar sala/sessão:", error);
        }
      })
      .on("broadcast", { event: "host-transferred" }, ({ payload }) => {
        const iAmHostNow = payload.newHostId === user.id;
        if (latestIsHost.current !== iAmHostNow) {
          latestIsHost.current = iAmHostNow;
          setUser(u => ({ ...u, isHost: iAmHostNow }));
        }
      });

    // Não é mais necessário fazer state-request, o estado vem do banco
    // setTimeout(() => {
    //   channel?.send({ type: "broadcast", event: "state-request", payload: { replyTo: user.id } });
    // }, 1)

    return () => {
      channel?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, code, user.id]);

  const startGame = () => {
    setGameStarted(true);
  };

  const value = useMemo(
    () => ({
      code,
      channel: channel!,
      onlinePlayers,
      currentUser: user,
      gameHasStarted,
      amIConnected,
      startGame,
    }),
    [code, onlinePlayers, user, gameHasStarted, channel, amIConnected]
  );

  return <RoomChannelContext.Provider value={value}>{children}</RoomChannelContext.Provider>;
}

function useRoomChannel() {
  return useContext(RoomChannelContext);
}

export { RoomChannelProvider, useRoomChannel };
