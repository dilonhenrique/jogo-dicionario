"use client";

import PageContainer from "@/lib/components/ui/Container/PageContainer";
import { RoomComplete } from "@/types/room";
import RoomContent from "./RoomContent";
import { RoomChannelProvider } from "@/lib/contexts/RoomContext";
import { GameProvider } from "@/lib/contexts/GameContext";
import RoomHeader from "./RoomHeader";

type Props = {
  room: RoomComplete;
}
export default function RoomPage({ room }: Props) {
  return (
    <RoomChannelProvider room={room}>
      <GameProvider roomCode={room.code}>
        <PageContainer className="relative min-h-dvh pb-36 items-stretch">
          <RoomHeader />
          <RoomContent room={room} />
        </PageContainer>
      </GameProvider>
    </RoomChannelProvider>
  )
}