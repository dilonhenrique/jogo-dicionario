import Pedestal from "./Pedestal";
import { GamePlayer } from "@/types/user";

type Props = {
  leaderboard: GamePlayer[];
}

export default function Podium({ leaderboard }: Props) {
  const [first, second, third] = leaderboard;

  return (
    <div className="grid grid-cols-3 items-end pt-10">
      <Pedestal player={second} position={2} />
      <Pedestal player={first} position={1} />
      <Pedestal player={third} position={3} />
    </div>
  )
}