import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { GamePlayer, Player } from "@/types/user";
import { Chip, cn, Tooltip } from "@heroui/react";
import { sortBy } from "lodash";
import { Star } from "lucide-react";
import { useMemo } from "react";

type Props = {
  players: (Player | GamePlayer)[];
  sortMode?: "me-first" | "points";
}

function pointSorter(item: Player | GamePlayer) {
  return "points" in item ? item.points * -1 : 1;
}

export function PlayerList({ players, sortMode = "me-first" }: Props) {
  const { currentUser } = useRoomChannel();

  const me = players.find(u => u.id === currentUser.id);
  const others = players.filter(u => u.id !== currentUser.id);

  const sorter = useMemo(() => sortMode === "points" ? [pointSorter, "name"] : "name", [sortMode]);
  const list = useMemo(() => {
    if (sortMode === "me-first" || !me) return sortBy(players, sorter);

    return [me, ...sortBy(others, sorter)];
  }, [sortMode, players, me, others, sorter]);

  return (
    <ul className="flex flex-col gap-2">
      {list.map((player) => (
        <li key={player.id} className="flex gap-4 justify-between items-center">
          <Chip
            variant="dot"
            color={player.onlineAt === null ? "danger" : "success"}
            classNames={{ base: cn(player.id === currentUser.id && "border-foreground/50") }}
            endContent={player.isHost && (
              <Tooltip content="Host">
                <Star size={14} className="mx-1" />
              </Tooltip>
            )}
          >
            {player.name}
          </Chip>

          {"points" in player &&
            <p className="text-primary">{player.points as number} pts</p>
          }
        </li>
      ))}
    </ul>
  );
} 