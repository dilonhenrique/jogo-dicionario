import { Player } from "@/types/user";
import { Chip } from "@heroui/react";

type Props = {
  players: Player[];
}

export function RoomPlayers({ players }: Props) {
  return <ul>
    {players.map(player =>
      <Chip
        key={player.id}
        variant="dot"
        color={player.onlineAt === null ? "danger" : "success"}
      >
        {player.name}
      </Chip>)}
  </ul>
} 