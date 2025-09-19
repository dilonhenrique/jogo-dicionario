import { useGame } from "@/lib/contexts/GameContext"
import FakeStage from "./Stages/FakeStage";
import WordSelector from "./Stages/WordSelector";
import VoteStage from "./Stages/VoteStage";
import PlayersDrawerButton from "./PlayersDrawer";
import StatusBar from "./StatusBar";
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { useSession } from "@/lib/contexts/SessionContext";
import HeaderContainer from "../../ui/HeaderContainer/HeaderContainer";
import HostControlButton from "../Room/HostControlButton";

export default function InGame() {
  const { user } = useSession();
  const { amIHost } = useRoomChannel();
  const { stage, currentRound, players } = useGame();

  if (!amIHost && !players.some(p => p.id === user.id)) {
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

      <HeaderContainer>
        {amIHost && <HostControlButton />}
        <PlayersDrawerButton />
      </HeaderContainer>

      {stage === "word_pick" && <WordSelector />}
      {stage === "fake" && <FakeStage />}
      {(stage === "vote" || stage === "blame") && <VoteStage />}

      <StatusBar />
    </>
  )
}