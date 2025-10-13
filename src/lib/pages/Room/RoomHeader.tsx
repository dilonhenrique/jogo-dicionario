"use client";

import { useRoomChannelSafe } from "@/lib/contexts/RoomContext";
import { useGameSafe } from "@/lib/contexts/GameContext";
import HostControlButton from "@/lib/components/modules/Host/HostControlButton";
import PlayersDrawerButton from "@/lib/components/modules/InGame/PlayersDrawer";
import { useParams } from "next/navigation";
import { useIsMounted } from "usehooks-ts";
import { Skeleton } from "@heroui/react";

export default function RoomHeader() {
  const { roomCode } = useParams();
  const roomChannel = useRoomChannelSafe();
  const game = useGameSafe();

  const isMounted = useIsMounted();

  const amIHost = roomChannel?.amIHost ?? false;
  const showPlayersDrawer = roomChannel?.amIConnected && game?.hasStarted;

  return (
    <div className="px-10">
    <header className="flex gap-2 pb-5 items-end justify-content-between border-b border-foreground-200 h-12">
      <h1 className="!text-large text-primary">Sala #{roomCode}</h1>

      <div className="flex justify-end items-center gap-2 grow">
        {!isMounted()
          ? (<Skeleton className="h-8 w-8 rounded-full" />)
          : (<>
            {amIHost && <HostControlButton />}
            {showPlayersDrawer && <PlayersDrawerButton />}
          </>)
        }
      </div>
    </header>
    </div>
  );
}
