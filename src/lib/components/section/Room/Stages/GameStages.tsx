import { useGame } from "@/lib/contexts/GameContext"
import DefinitionStage from "./DefinitionStage";
import WordSelector from "./WordSelector";
import { RoomPlayers } from "../RoomPlayers";

export default function GameState() {
  const { stage, players } = useGame();

  return (
    <div>
      <RoomPlayers players={players} />

      {stage === "word_pick" && <WordSelector />}
      {stage === "definition" && <DefinitionStage />}
    </div>
  )
}