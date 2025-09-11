import { useRoomChannel } from "@/lib/contexts/RoomContext";
import InGame from "../InGame/InGame";
import { GameProvider } from "@/lib/contexts/GameContext";
import RoomSetup from "./RoomSetup";
import { PlayerList } from "../Player/PlayerList";
import { GameConfig, GameState } from "@/types/game";
import { useEffect, useState } from "react";
import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";

export default function Room() {
  const { channel, gameHasStarted, onlinePlayers, startGame, currentUser } = useRoomChannel();

  const [configs, setConfigs] = useState(DEFAULT_CONFIG);
  const [initialState, setInitialState] = useState<Partial<GameState>>();

  function hostStartNewGame(config: GameConfig) {
    setConfigs((current) => ({ ...current, ...config }));
    startGame();
  }

  useEffect(() => {
    channel?.on('broadcast', { event: 'game-state' }, ({ payload }) => {
      const { to, ...gameState } = payload || {};

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

          {currentUser.isHost && <RoomSetup hostStartNewGame={hostStartNewGame} />}
          {!currentUser.isHost && <p>Aguardando host iniciar partida...</p>}
        </>
      )
  );
}