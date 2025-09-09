import { useRoomChannel } from "@/lib/contexts/RoomContext";
import GameStage from "./Stages/GameStages";
import { GameProvider } from "@/lib/contexts/GameContext";
import GameSetup from "./GameSetup";
import { RoomPlayers } from "./RoomPlayers";

export default function GameRoom() {
  const { gameHasStarted, onlinePlayers } = useRoomChannel();

  return (
    !gameHasStarted
      ? <>
        <RoomPlayers players={onlinePlayers} />
        <GameSetup />
      </>
      : <GameProvider>
        <GameStage />
      </GameProvider>
  )
}