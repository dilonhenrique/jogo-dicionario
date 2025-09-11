"use client";

import { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { joinRoomChannel } from "@/server/room/joinRoomChannel";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Player, User } from "@/types/user";
import { useLatest } from "../hooks/useLatest";
import useFirstRender from "../hooks/useFirstRender";

type RoomChannelContextValue = {
  code: string;
  channel: RealtimeChannel;
  onlinePlayers: Player[];
  currentUser: User;
  gameHasStarted: boolean;
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

  const latestGameStarted = useLatest(gameHasStarted);
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

        const host = players.find(p => p.isHost);
        if (host) {
          const iAmHostNow = host.id === user.id;

          if (latestIsHost.current !== iAmHostNow) {
            latestIsHost.current = iAmHostNow;
            setUser(u => (u.isHost === iAmHostNow ? u : { ...u, isHost: iAmHostNow }));
          }

          return;
        }

        const sorted = [...players].sort((a, b) => {
          const ta = new Date(a.onlineAt || 0).getTime();
          const tb = new Date(b.onlineAt || 0).getTime();
          if (ta !== tb) return ta - tb;
          return (a.id || "").localeCompare(b.id || "");
        });

        const shouldClaim = sorted[0]?.id === user.id;
        if (!shouldClaim) return;

        latestIsHost.current = true;
        setUser(u => (u.isHost ? u : { ...u, isHost: true }));

        await channel.track({
          ...user,
          onlineAt: new Date().toISOString(),
          isHost: true,
        });
      })
      .on("broadcast", { event: "state-request" }, ({ payload }) => {
        if (latestIsHost.current) {
          channel.send({
            type: "broadcast",
            event: "room-state",
            payload: {
              to: payload.replyTo,
              gameHasStarted: latestGameStarted.current
            },
          });
        }
      })
      .on("broadcast", { event: "room-state" }, ({ payload }) => {
        if (payload.to === user.id && typeof payload?.gameHasStarted === "boolean") {
          setGameStarted(payload.gameHasStarted);
        }
      });

    setTimeout(() => {
      channel?.send({ type: "broadcast", event: "state-request", payload: { replyTo: user.id } });
    }, 1)

    return () => {
      channel?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, code, user.id]);

  const startGame = () => {
    // channel!.send({ type: "broadcast", event: "start-game" });
    setGameStarted(true);
  };

  const value = useMemo(
    () => ({
      code,
      channel: channel!,
      onlinePlayers,
      currentUser: user,
      gameHasStarted,
      startGame,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [code, onlinePlayers, user, gameHasStarted, channel]
  );

  return <RoomChannelContext.Provider value={value}>{children}</RoomChannelContext.Provider>;
}

function useRoomChannel() {
  return useContext(RoomChannelContext);
}

export { RoomChannelProvider, useRoomChannel };
