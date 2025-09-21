import { useSession } from "@/lib/contexts/SessionContext";
import { Player } from "@/types/user";
import { sortBy } from "lodash";
import PlayerChip from "./PlayerChip";
import { Button } from "@heroui/react";
import { Trash } from "lucide-react";

type Props = {
  players: Player[];
  onRemove?: (player: Player) => void;
}

export function PlayerList({ players, onRemove }: Props) {
  const { user: currentUser } = useSession();

  const me = players.find(u => u.id === currentUser.id);
  const others = players.filter(u => u.id !== currentUser.id);

  const list = [...(me ? [me] : []), ...sortBy(others, "name")];

  return (
    <ul className="flex flex-col gap-2">
      {list.map((player) => (
        <li key={player.id} className="flex gap-2 items-center group">
          <PlayerChip player={player} />
          {onRemove && (
            <Button
              isIconOnly
              size="sm"
              color="danger"
              variant="light"
              radius="full"
              className="opacity-0 group-hover:opacity-100"
              startContent={<Trash size={14} />}
              onPress={() => onRemove(player)}
            />
          )}
        </li>
      ))}
    </ul>
  );
} 