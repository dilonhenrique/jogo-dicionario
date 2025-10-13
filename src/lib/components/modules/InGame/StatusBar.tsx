import { useGameSafe } from "@/lib/contexts/GameContext";
import { Progress } from "@heroui/react";
import { useMemo } from "react";

type StatusStage = "waiting-word" | "faking" | "voting" | "blame";
type GameStatus = {
  status: StatusStage;
  label: string;
  percentage?: number;
}

export default function StatusBar() {
  const game = useGameSafe();

  const status: GameStatus | null = useMemo(() => {
    if (!game.hasStarted) return null;

    switch (game.stage) {
      case "word_pick":
        return { status: "waiting-word", label: "Aguardando palavra..." };

      case "fake":
        {
          const totalAnswered = game.players.map(p => game.currentRound?.fakes
            .some(f => f.author.id === p.id) ?? false)
            .filter(Boolean).length;

          const percentage = (totalAnswered / game.players.length) * 100;
          return { status: "faking", percentage, label: `Respostas enviadas: ${totalAnswered}/${game.players.length}` };
        }

      case "vote":
        {
          const totalVotes = game.players.map(p => game.votes.has(p.id)).filter(Boolean).length;
          const percentage = (totalVotes / game.players.length) * 100;
          return { status: "voting", percentage, label: `Votos: ${totalVotes}/${game.players.length}` };
        }

      case "blame":
      case "finishing":
        return { status: "blame", label: "Aguardando próxima rodada..." };
    }
  }, [game]);

  if (!game.hasStarted || !status || game.stage === "finishing") return null;

  const isIndeterminate = status?.percentage === undefined;

  return (
    <div className="px-10">
      <div className="relative border border-foreground-200 bg-foreground-50 p-6 rounded-xl text-center overflow-hidden -mt-5">
        <h6 className="text-foreground-600">{status.label}</h6>

        <Progress
          size="sm"
          value={status.percentage}
          isIndeterminate={isIndeterminate}
          maxValue={100}
          color={isIndeterminate ? "default" : "success"}
          className="absolute bottom-0 right-0 left-0"
          aria-label="Status do estágio atual da rodada"
        />
      </div>
    </div>
  );
}