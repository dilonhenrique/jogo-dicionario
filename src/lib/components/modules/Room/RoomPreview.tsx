import { useRoomChannel } from "@/lib/contexts/RoomContext";
import RoomSetup from "./RoomSetup";
import { Divider, Spinner } from "@heroui/react";
import { PlayerList } from "../Player/PlayerList";
import { GameConfig } from "@/types/game";

type Props = {
  hostStartNewGame: (config: GameConfig) => void
}

export default function RoomPreview({ hostStartNewGame }: Props) {
  const { onlinePlayers, currentUser, amIConnected } = useRoomChannel();

  return (
    <div className="flex flex-col gap-4">
      {!amIConnected && (
        <div className="text-center flex flex-col gap-2 items-center py-4">
          <Spinner size="sm" />
          <p className="text-sm text-foreground-500">Entrando na sala...</p>
        </div>
      )}

      {amIConnected && currentUser.isHost && <RoomSetup hostStartNewGame={hostStartNewGame} />}
      {amIConnected && !currentUser.isHost &&
        <>
          <p className="text-foreground-400">Aguardando host iniciar partida...</p>
          <Divider className="mt-2" />
        </>
      }

      <div className="flex flex-col gap-2">
        <h5>Participantes</h5>
        <PlayerList players={onlinePlayers} />
      </div>
    </div>
  );
}