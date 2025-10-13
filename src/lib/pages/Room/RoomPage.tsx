"use client";

import PageContainer from "@/lib/components/ui/Container/PageContainer";
import { RoomComplete } from "@/types/room";
import RoomContent from "./RoomContent";
import { RoomChannelProvider } from "@/lib/contexts/RoomContext";
import { GameProvider } from "@/lib/contexts/GameContext";
import RoomHeader from "./RoomHeader";
import StatusBar from "@/lib/components/modules/InGame/StatusBar";

type Props = {
  room: RoomComplete;
}
export default function RoomPage({ room }: Props) {
  return (
    <RoomChannelProvider room={room}>
      <GameProvider roomCode={room.code}>
        <PageContainer className="relative h-dvh gap-0 px-0 items-stretch">
          <RoomHeader />

          <div className="grow shrink min-h-0 overflow-auto flex flex-col gap-4 items-stretch px-10 pt-5 pb-10">
            <RoomContent room={room} />
          </div>

          <StatusBar />
        </PageContainer>
      </GameProvider>
    </RoomChannelProvider>
  )
}