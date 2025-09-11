import { useGame } from "@/lib/contexts/GameContext"
import FakeStage from "./Stages/FakeStage";
import WordSelector from "./Stages/WordSelector";
import VoteStage from "./Stages/VoteStage";
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import PlayersDrawer from "./PlayersDrawer";

export default function InGame() {
  const { currentUser } = useRoomChannel();
  const { stage, players } = useGame();


  if (!currentUser.isHost && !players.some(p => p.id === currentUser.id)) {
    return <p>A partida já começou (sem você)</p>;
  }

  return (
    <div>
      {stage === "word_pick" && <WordSelector />}
      {stage === "fake" && <FakeStage />}
      {(stage === "vote" || stage === "blame") && <VoteStage />}

      <PlayersDrawer />
    </div>
  )
}