import { useGame } from "@/lib/contexts/GameContext"
import DefinitionStage from "./Stages/DefinitionStage";
import WordSelector from "./Stages/WordSelector";
import { RoomPlayers } from "../Player/PlayerList";

export default function InGame() {
  const { stage, players } = useGame();

  return (
    <div>
      <RoomPlayers players={players} />

      {stage === "word_pick" && <WordSelector />}
      {stage === "definition" && <DefinitionStage />}
    </div>
  )
}