"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { joinRoomChannel } from "@/server/room/joinRoomChannel";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Player, User } from "@/types/user";

type RoomChannelContextValue = {
  code: string;
  channel: RealtimeChannel;
  onlinePlayers: Player[];
  currentUser: User;
}

const RoomChannelContext = createContext<RoomChannelContextValue>({} as RoomChannelContextValue);

type Props = PropsWithChildren & {
  code: string;
  user: User;
};

function RoomChannelProvider({ children, code, user }: Props) {
  const [channel] = useState(joinRoomChannel({ code, user }));
  const [onlinePlayers, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      setPlayers(Object.values(state).map(s => (s[0] as unknown as Player)));
    })
      .on('presence', { event: 'join' }, ({ currentPresences }) => {
        console.log(currentPresences as unknown as Player[])
      })
      .on('presence', { event: 'leave' }, ({ currentPresences }) => {
        console.log(currentPresences as unknown as Player[])
      })

    return () => { }
  }, [channel])

  return (<RoomChannelContext.Provider value={{ code, channel, onlinePlayers, currentUser: user }}>
    {children}
  </RoomChannelContext.Provider>)
}

function useRoomChannel() {
  return useContext(RoomChannelContext);
}

export { RoomChannelProvider, useRoomChannel }