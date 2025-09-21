import { useSession } from "@/lib/contexts/SessionContext";
import { Player } from "@/types/user";
import { sortBy } from "lodash";
import PlayerChip from "./PlayerChip";

type Props = {
  players: Player[];
}

export function PlayerList({ players }: Props) {
  const { user: currentUser } = useSession();

  const me = players.find(u => u.id === currentUser.id);
  const others = players.filter(u => u.id !== currentUser.id);

  const list = [...(me ? [me] : []), ...sortBy(others, "name")];

  return (
    <ul className="flex flex-col gap-2">
      {list.map((player) => (
        <li key={player.id} className="flex gap-4 justify-between items-center">
          <PlayerChip player={player} />
        </li>
      ))}
    </ul>
  );
} 