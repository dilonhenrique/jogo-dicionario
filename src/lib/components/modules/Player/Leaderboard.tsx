import { GamePlayer } from "@/types/user";
import PlayerChip from "./PlayerChip";
import { sortByPoints } from "@/lib/utils/sortByPoints";
import { getPositionColor } from "@/lib/utils/getPositionColor";
import { Chip } from "@heroui/react";

type Props = {
  players: GamePlayer[];
  disableLeaderColor?: boolean;
  roundPoints?: Map<string, number>;
}

export default function Leaderboard({ players, disableLeaderColor, roundPoints }: Props) {
  const list = sortByPoints(players);

  return (
    <ul className="flex flex-col gap-4 divide-y divide-foreground-100">
      {list.map((player, index) => {
        const pointsGained = roundPoints?.get(player.id) || 0;
        
        return (
          <li key={player.id} className="flex gap-4 justify-between items-center pb-4">
            <PlayerChip player={player} size="lg" classNames={{ base: "border-none px-0" }} />

            <div className="flex items-center gap-2">
              <p className={disableLeaderColor ? "text-default-400" : getPositionColor(index + 1)}>
                {player.points} pts
              </p>
              
              {pointsGained > 0 && (
                <Chip size="sm" color="success" variant="flat">
                  +{pointsGained}
                </Chip>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}