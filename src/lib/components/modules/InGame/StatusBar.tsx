import { useGame } from "@/lib/contexts/GameContext";
import { Progress } from "@heroui/react";
import { useMemo } from "react";

type StatusStage = "waiting-word" | "faking" | "voting" | "blame";
type GameStatus = {
  status: StatusStage;
  label: string;
  percentage?: number;
}

export default function StatusBar() {
  const { stage, players, currentRound, votes } = useGame();

  const { percentage, label }: GameStatus = useMemo(() => {
    switch (stage) {
      case "word_pick":
        return { status: "waiting-word", label: "Aguardando palavra..." };

      case "fake":
        {
          const onlinePlayers = players.filter(p => p.onlineAt !== null);
          const totalAnswered = onlinePlayers.map(p => currentRound?.fakes
            .some(f => f.author.id === p.id) ?? false)
            .filter(Boolean).length;

          const percentage = (totalAnswered / onlinePlayers.length) * 100;
          return { status: "faking", percentage, label: `Respostas enviadas: ${totalAnswered}/${onlinePlayers.length}` };
        }

      case "vote":
        {
          const onlinePlayers = players.filter(p => p.onlineAt !== null);
          const totalVotes = onlinePlayers.map(p => votes.has(p.id)).filter(Boolean).length;
          const percentage = (totalVotes / onlinePlayers.length) * 100;
          return { status: "voting", percentage, label: `Votos: ${totalVotes}/${onlinePlayers.length}` };
        }

      case "blame":
      case "finishing":
        return { status: "blame", label: "Aguardando próxima rodada..." };
    }
  }, [currentRound, players, stage, votes]);

  const isIndeterminate = percentage === undefined;

  if (stage === "finishing") return null;

  return (
    <div className="fixed bottom-0 w-full max-w-2xl p-10 -ms-10">
      <div className="border border-foreground-200 bg-foreground-50 p-6 rounded-xl text-center relative overflow-hidden">
        <h6 className="text-foreground-600">{label}</h6>

        <Progress
          size="sm"
          value={percentage}
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