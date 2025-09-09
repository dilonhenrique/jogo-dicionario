import { useRoomChannel } from "@/lib/contexts/RoomContext"
import { Chip } from "@heroui/react";

export function RoomPlayers() {
  const { players } = useRoomChannel();

  return <ul>
    {players.map(player =>
      <Chip
        key={player.id}
        variant="dot"
        color="success"
      >
        {player.name}
      </Chip>)}
  </ul>
} 