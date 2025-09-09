"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { joinRoomChannel } from "@/server/room/joinRoomChannel";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Player, User } from "@/types/user";

type RoomChannelContextValue = {
  code: string;
  channel: RealtimeChannel;
  players: Player[];
}

const RoomChannelContext = createContext<RoomChannelContextValue>({} as RoomChannelContextValue);

type Props = PropsWithChildren & {
  code: string;
  user: User;
};

function RoomChannelProvider({ children, code, user }: Props) {
  const [channel, setChannel] = useState(joinRoomChannel({ code, user }));
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState(); // mapa de userId -> metas



      setPlayers(Object.values(state).map(s => (s[0] as unknown as Player)))
      // atualiza lista de jogadores online
    })
      .on('presence', { event: 'join' }, ({ newPresences, currentPresences }) => {
        console.log(currentPresences as unknown as Player[])
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences, currentPresences }) => {
        console.log(currentPresences as unknown as Player[])
      })

    return () => { }
  }, [channel])

  return (<RoomChannelContext.Provider value={{ code, channel, players }}>
    {children}
  </RoomChannelContext.Provider>)
}

function useRoomChannel() {
  return useContext(RoomChannelContext);
}

export { RoomChannelProvider, useRoomChannel }