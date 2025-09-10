import { useGame } from "@/lib/contexts/GameContext"
import DefinitionStage from "./Stages/DefinitionStage";
import WordSelector from "./Stages/WordSelector";
import { PlayerList } from "../Player/PlayerList";
import GuessStage from "./Stages/GuessStage";

export default function InGame() {
  const { stage, players } = useGame();

  return (
    <div>
      <PlayerList players={players} />

      {stage === "word_pick" && <WordSelector />}
      {stage === "definition" && <DefinitionStage />}
      {stage === "guess" && <GuessStage />}
    </div>
  )
}