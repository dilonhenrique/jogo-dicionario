import { useSession } from "@/lib/contexts/SessionContext";
import { PlayerList } from "../Player/PlayerList";
import RemovePlayerModal from "./RemovePlayerModal";
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { useGame } from "@/lib/contexts/GameContext";
import { useState } from "react";
import { Player } from "@/types/user";

export default function KickPlayers() {
  const { user } = useSession();
  const { amIHost } = useRoomChannel();
  const { players } = useGame();

  const [removePlayer, setRemovePlayer] = useState<Player | null>(null);
  const playersToRemove = players?.filter(p => p.id !== user.id) ?? [];

  if (playersToRemove.length === 0) return null;

  return (
    <>
      <h5>Expulsar jogador</h5>
      <PlayerList
        players={playersToRemove}
        onRemove={amIHost ? (player) => setRemovePlayer(player) : undefined}
      />

      <RemovePlayerModal
        player={removePlayer}
        onClose={() => setRemovePlayer(null)}
      />
    </>
  );
}