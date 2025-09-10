import { useGame } from "@/lib/contexts/GameContext"
import FakeStage from "./Stages/FakeStage";
import WordSelector from "./Stages/WordSelector";
import { PlayerList } from "../Player/PlayerList";
import VoteStage from "./Stages/VoteStage";

export default function InGame() {
  const { stage, players } = useGame();

  return (
    <div>
      <PlayerList players={players} />

      {stage === "word_pick" && <WordSelector />}
      {stage === "fake" && <FakeStage />}
      {stage === "vote" && <VoteStage />}
    </div>
  )
}