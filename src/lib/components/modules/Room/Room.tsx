import { useRoomChannel } from "@/lib/contexts/RoomContext";
import InGame from "../InGame/InGame";
import { GameProvider } from "@/lib/contexts/GameContext";
import RoomSetup from "./RoomSetup";
import { PlayerList } from "../Player/PlayerList";
import { GameConfig, GameState, WordDictionary } from "@/types/game";
import { useEffect, useState } from "react";
import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";
import { Divider } from "@heroui/react";
import { getNewRandomWord } from "@/server/dictionary/dictionaty.service";

export default function Room() {
  const { channel, gameHasStarted, onlinePlayers, startGame, currentUser } = useRoomChannel();

  const [configs, setConfigs] = useState(DEFAULT_CONFIG);
  const [initialState, setInitialState] = useState<Partial<GameState>>();

  async function hostStartNewGame(config: Partial<GameConfig>) {
    const finalConfig: GameConfig = { ...DEFAULT_CONFIG, ...config };
    setConfigs(finalConfig);

    const hostChooseWord = finalConfig.enableHostChooseWord === true;
    let word: WordDictionary | null = null;

    if (!hostChooseWord) {
      word = await getNewRandomWord();
    }

    setInitialState((current) => (
      {
        ...current,
        stage: hostChooseWord ? "word_pick" : "fake",
        currentRound: word ? { word, fakes: [] } : undefined,
        // players: [
        //   {
        //     id: "123456",
        //     isHost: true,
        //     onlineAt: new Date().toISOString(),
        //     name: "Antonio",
        //     points: 6,
        //   },
        //   {
        //     id: "5654654",
        //     isHost: false,
        //     onlineAt: new Date().toISOString(),
        //     name: "Zulmira",
        //     points: 3,
        //   },
        //   {
        //     id: "654984",
        //     isHost: false,
        //     onlineAt: new Date().toISOString(),
        //     name: "Maria",
        //     points: 2,
        //   },
        //   {
        //     id: "4654894",
        //     isHost: false,
        //     onlineAt: new Date().toISOString(),
        //     name: "Francisco",
        //     points: 3,
        //   }
        // ]
      }
    ));

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