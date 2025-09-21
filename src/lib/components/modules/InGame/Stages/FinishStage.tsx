import { useGame } from "@/lib/contexts/GameContext";
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { sortByPoints } from "@/lib/utils/sortByPoints";
import Podium from "../../Player/Podium";
import Leaderboard from "../../Player/Leaderboard";
import { Button } from "@heroui/react";
import { SwordsIcon } from "lucide-react";

export default function FinishStage() {
  const { amIHost } = useRoomChannel();
  const { players, actions } = useGame();

  const leaderboard = sortByPoints(players);
  const [champion] = leaderboard;

  const others = leaderboard.slice(3)

  return (
    <>
      <div className="flex flex-col gap-4">
        <Podium leaderboard={leaderboard} />

        <div className="rounded-full bg-warning-300 border-2 border-warning p-3 text-center -mx-4">
          <p className="text-xs -mt-0.5">VENCEDOR</p>
          <p className="font-bold text-2xl">
            {champion.name}
          </p>
        </div>
      </div>

      {others.length > 0 && (
        <Leaderboard players={others} disableLeaderColor />
      )}

      {amIHost && (
        <Button
          color="primary"
          className="mt-auto self-center"
          onPress={actions.restartGame}
          startContent={<SwordsIcon size={16} />}
        >
          Jogar de novo
        </Button>
      )}
    </>
  );
}