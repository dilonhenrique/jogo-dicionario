import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { Player } from "@/types/user";
import { Chip, Tooltip } from "@heroui/react";
import { sortBy } from "lodash";
import { Star } from "lucide-react";
import { useMemo } from "react";

type Props = {
  players: Player[];
  disableMeFirst?: boolean;
}

export function PlayerList({ players, disableMeFirst }: Props) {
  const { currentUser } = useRoomChannel();

  const me = players.find(u => u.id === currentUser.id);
  const others = players.filter(u => u.id !== currentUser.id);

  const list = useMemo(() => {
    if (disableMeFirst || !me) return sortBy(players, "name");

    return [me, ...sortBy(others, "name")]
  }, [disableMeFirst, players, me, others]);

  return <ul className="flex flex-col gap-2">
    {list.map(player =>
      <Chip
        key={player.id}
        variant="dot"
        color={player.onlineAt === null ? "danger" : "success"}
        endContent={player.isHost && (
          <Tooltip content="Host">
            <Star size={14} className="ms-1" />
          </Tooltip>
        )}
      >
        {player.name}
      </Chip>)}
  </ul>
} 