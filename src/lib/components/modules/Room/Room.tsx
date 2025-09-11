import { useRoomChannel } from "@/lib/contexts/RoomContext";
import InGame from "../InGame/InGame";
import { GameProvider } from "@/lib/contexts/GameContext";
import RoomSetup from "./RoomSetup";
import { PlayerList } from "../Player/PlayerList";
import { GameConfig, GameState } from "@/types/game";
import { useEffect, useState } from "react";
import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";
import { Divider } from "@heroui/react";

export default function Room() {
  const { channel, gameHasStarted, onlinePlayers, startGame, currentUser } = useRoomChannel();

  const [configs, setConfigs] = useState(DEFAULT_CONFIG);
  const [initialState, setInitialState] = useState<Partial<GameState>>();

  function hostStartNewGame(config: Partial<GameConfig>) {
    console.log(config);
    setConfigs((current) => ({ ...current, ...config }));
    setInitialState((current) =>
    ({
      ...current,
      stage: config.enableHostChooseWord === true
        ? "word_pick"
        : "fake"
    })
    );

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
        <div className="flex flex-col gap-4">
          {currentUser.isHost && <RoomSetup hostStartNewGame={hostStartNewGame} />}
          {!currentUser.isHost &&
            <>
              <p className="text-foreground-400">Aguardando host iniciar partida...</p>
              <Divider className="mt-2" />
            </>
          }

          <div className="flex flex-col gap-2">
            <h5>Participantes</h5>
            <PlayerList players={onlinePlayers} />
          </div>
        </div>
      )
  );
}