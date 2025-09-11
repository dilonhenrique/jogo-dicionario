import { useGame } from "@/lib/contexts/GameContext"
import FakeStage from "./Stages/FakeStage";
import WordSelector from "./Stages/WordSelector";
import { PlayerList } from "../Player/PlayerList";
import VoteStage from "./Stages/VoteStage";
import { useRoomChannel } from "@/lib/contexts/RoomContext";

export default function InGame() {
  const { currentUser } = useRoomChannel();
  const { stage, players } = useGame();

  if (!currentUser.isHost && !players.some(p => p.id === currentUser.id)) {
    return <p>A partida já começou</p>;
  }

  return (
    <div>
      <PlayerList players={players} />

      {stage === "word_pick" && <WordSelector />}
      {stage === "fake" && <FakeStage />}
      {stage === "vote" && <VoteStage />}
    </div>
  )
}