import { GamePlayer } from "@/types/user";
import PlayerChip from "./PlayerChip";
import { sortByPoints } from "@/lib/utils/sortByPoints";
import { getPositionColor } from "@/lib/utils/getPositionColor";

type Props = {
  players: GamePlayer[];
  disableLeaderColor?: boolean;
}

export default function Leaderboard({ players, disableLeaderColor }: Props) {
  const list = sortByPoints(players);

  return (
    <ul className="flex flex-col gap-4 divide-y divide-foreground-100">
      {list.map((player, index) => (
        <li key={player.id} className="flex gap-4 justify-between items-center pb-4">
          <PlayerChip player={player} size="lg" classNames={{ base: "border-none px-0" }} />

          <p className={disableLeaderColor ? "text-default-400" : getPositionColor(index + 1)}>
            {player.points} pts
          </p>
        </li>
      ))}
    </ul>
  );
}