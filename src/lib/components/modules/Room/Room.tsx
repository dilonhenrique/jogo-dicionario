import { useRoomChannel } from "@/lib/contexts/RoomContext";
import InGame from "../InGame/InGame";
import { GameProvider } from "@/lib/contexts/GameContext";
import RoomSetup from "./RoomSetup";
import { PlayerList } from "../Player/PlayerList";
import { GameConfig, GameState, WordDictionary, WordRound } from "@/types/game";
import { useEffect, useState } from "react";
import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";
import { Divider } from "@heroui/react";
import { getNewRandomWord } from "@/server/dictionary/dictionary.service";
import { getInitialState } from "./state.debug";

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
      [word] = await getNewRandomWord();
    }

    setInitialState((current) => (
      {
        ...current,
        // stage: hostChooseWord ? "word_pick" : "fake",
        // currentRound: word ? { word, fakes: [] } : undefined,
        ...getInitialState(hostChooseWord, word, currentUser.id),
      }
    ));

    startGame();
  }

  useEffect(() => {
    channel
      ?.on('broadcast', { event: 'game-state' }, ({ payload }) => {
        const { to, ...gameState } = payload || {};
        if (to === currentUser.id) {
          setInitialState(gameState);
          startGame();
        }
      })
      .on("broadcast", { event: "start-game" }, ({ payload }) => {
        setConfigs((curr) => ({ ...curr, ...payload.configs }));
        setInitialState((curr) => ({ ...curr, ...payload.initialState }));
        startGame();
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
