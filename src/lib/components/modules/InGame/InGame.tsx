import { useGame } from "@/lib/contexts/GameContext"
import FakeStage from "./Stages/FakeStage";
import WordSelector from "./Stages/WordSelector";
import VoteStage from "./Stages/VoteStage";
import PlayersDrawer from "./PlayersDrawer";
import StatusBar from "./StatusBar";
import { useSession } from "@/lib/contexts/SessionContext";

export default function InGame() {
  const { user: currentUser } = useSession();
  const { stage, players, currentRound } = useGame();


  if (!currentUser.isHost && !players.some(p => p.id === currentUser.id)) {
    return <p>A partida já começou (sem você)</p>;
  }

  return (
    <>
      {currentRound && (
        <div className="flex flex-col">
          <p className="text-foreground-500 text-small">A palavra é...</p>
          <h2>{currentRound.word.label}</h2>
        </div>
      )}

      <PlayersDrawer />

      {stage === "word_pick" && <WordSelector />}
      {stage === "fake" && <FakeStage />}
      {(stage === "vote" || stage === "blame") && <VoteStage />}

      <StatusBar />
    </>
  )
}