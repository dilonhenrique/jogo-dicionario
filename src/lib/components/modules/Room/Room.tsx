import { useRoomChannel } from "@/lib/contexts/RoomContext";
import InGame from "../InGame/InGame";
import { GameProvider } from "@/lib/contexts/GameContext";
import { GameConfig, GameState, WordDictionary } from "@/types/game";
import { useEffect, useState } from "react";
import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";
import { getNewRandomWord } from "@/server/services/dictionary/dictionary.service";
import { getInitialState } from "./state.debug";
import RoomPreview from "./RoomPreview";

export default function Room() {
  const { channel, gameHasStarted, startGame, currentUser } = useRoomChannel();

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
        <RoomPreview hostStartNewGame={hostStartNewGame} />
      )
  );
}
