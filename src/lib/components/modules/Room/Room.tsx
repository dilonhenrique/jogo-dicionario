import { useRoomChannel } from "@/lib/contexts/RoomContext";
import InGame from "../InGame/InGame";
import { GameProvider } from "@/lib/contexts/GameContext";
import RoomSetup from "./RoomSetup";
import { PlayerList } from "../Player/PlayerList";
import { GameConfig, GameState } from "@/types/game";
import { useEffect, useState } from "react";

const defaultConfig: GameConfig = {
  maxPoints: 5,
}

export default function Room() {
  const { channel, gameHasStarted, onlinePlayers, startGame, currentUser } = useRoomChannel();

  const [configs, setConfigs] = useState(defaultConfig);
  const [initialState, setInitialState] = useState<Partial<GameState>>();

  function startNewGame(config: GameConfig) {
    setConfigs({ ...defaultConfig, ...config });
    startGame();
  }

  useEffect(() => {
    channel?.on('broadcast', { event: 'game-state' }, ({ payload }) => {
      const { to, ...gameState } = payload || {};

      console.log("game state recebido", to === currentUser.id);
      if (to === currentUser.id) {
        setInitialState(gameState);
        startGame();
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel])

  return (
    gameHasStarted
      ? (
        <GameProvider configs={configs} initialState={initialState}>
          <InGame />
        </GameProvider>
      )
      : (
        <>
          <PlayerList players={onlinePlayers} />
          <RoomSetup startNewGame={startNewGame} />
        </>
      )
  );
}