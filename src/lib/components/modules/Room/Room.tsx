import { useRoomChannel } from "@/lib/contexts/RoomContext";
import GameStage from "../InGame/InGame";
import { GameProvider } from "@/lib/contexts/GameContext";
import RoomSetup from "./RoomSetup";
import { RoomPlayers } from "../Player/PlayerList";
import { GameConfig } from "@/types/game";
import { useState } from "react";

const defaultConfig: GameConfig = {
  maxPoints: 5,
}

export default function Room() {
  const { gameHasStarted, onlinePlayers, startGame } = useRoomChannel();
  const [configs, setConfigs] = useState(defaultConfig);

  function startNewGame(config: GameConfig) {
    setConfigs({ ...defaultConfig, ...config });
    startGame();
  }

  return (
    !gameHasStarted
      ? (<>
        <RoomPlayers players={onlinePlayers} />
        <RoomSetup startNewGame={startNewGame} />
      </>)
      : (
        <GameProvider configs={configs}>
          <GameStage />
        </GameProvider>
      )
  );
}