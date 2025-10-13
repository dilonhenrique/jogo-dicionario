import { useSession } from "@/lib/contexts/SessionContext";
import { PlayerList } from "../Player/PlayerList";
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { useGameSafe } from "@/lib/contexts/GameContext";
import { Player } from "@/types/user";
import { addToast } from "@heroui/react";

export default function KickPlayers() {
  const { user } = useSession();
  const { amIHost, kickPlayer } = useRoomChannel();
  const game = useGameSafe();

  if (!game.hasStarted) return null;

  const { players, actions } = game;

  async function handleRemovePlayer(player?: Player) {
    if (!player?.id) return;

    try {
      await actions.kickPlayer(player.id);
      kickPlayer(player.id);

      addToast({
        title: "Jogador expulso",
        description: `${player.name} foi removido da sala.`,
        color: "danger",
        severity: 'success',
      });
    } catch (error) {
      console.error("Erro ao expulsar jogador:", error);
    }
  }

  const playersToRemove = players?.filter(p => p.id !== user.id) ?? [];

  if (playersToRemove.length === 0) return null;

  return (
    <>
      <h5>Expulsar jogador</h5>
      <PlayerList
        players={playersToRemove}
        onRemove={amIHost ? handleRemovePlayer : undefined}
      />
    </>
  );
}