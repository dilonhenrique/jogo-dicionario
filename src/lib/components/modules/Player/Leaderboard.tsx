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

  function getPositionColor(index: number) {
    switch (index) {
      case 0:
        return "text-warning font-bold";
      case 1:
        return "text-cyan-600 font-bold";
      case 2:
        return "text-amber-700 font-bold";
      default:
        return "text-default-400";
    }
  }

  return (
    <ul className="flex flex-col gap-4 divide-y divide-foreground-100">
      {list.map((player, index) => (
        <li key={player.id} className="flex gap-4 justify-between items-center pb-4">
          <PlayerChip player={player} size="lg" classNames={{ base: "border-none px-0" }} />

          <p className={getPositionColor(index)}>
            {player.points} pts
          </p>
        </li>
      ))}
    </ul>
  );
}