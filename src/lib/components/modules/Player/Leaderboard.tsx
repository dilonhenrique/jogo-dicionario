import { GamePlayer } from "@/types/user";
import PlayerChip from "./PlayerChip";
import { sortBy } from "lodash";

type Props = {
  players: GamePlayer[];
}

function pointSorter(item: GamePlayer) {
  return item.points * -1;
}

export default function Leaderboard({ players }: Props) {
  const list = sortBy(players, [pointSorter, "name"]);

  return (
    <ul className="flex flex-col gap-2">
      {list.map((player) => (
        <li key={player.id} className="flex gap-4 justify-between items-center">
          <PlayerChip player={player} />

          <p className="text-primary">
            {player.points as number} pts
          </p>
        </li>
      ))}
    </ul>
  );
}