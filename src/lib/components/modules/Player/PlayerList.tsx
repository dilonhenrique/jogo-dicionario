import { Player } from "@/types/user";
import { Chip } from "@heroui/react";

type Props = {
  players: Player[];
}

export function PlayerList({ players }: Props) {
  return <ul className="flex flex-col gap-2">
    {players.map(player =>
      <Chip
        key={player.id}
        size="sm"
        variant="dot"
        color={player.onlineAt === null ? "danger" : "success"}
      >
        {player.name}
        {player.isHost && "(Host)"}
      </Chip>)}
  </ul>
} 