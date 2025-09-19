import { useRoomChannel } from "@/lib/contexts/RoomContext";
import InGame from "../InGame/InGame";
import { GameProvider } from "@/lib/contexts/GameContext";
import { GameConfig, GameState, WordDictionary } from "@/types/game";
import { useEffect, useState } from "react";
import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";
import { dictionaryService } from "@/server/services/dictionary";
import RoomPreview from "./RoomPreview";
import { gameSessionService } from "@/server/services/gameSession";

export default function Room() {
  const { channel, gameHasStarted, startGame, code } = useRoomChannel();

  const [configs, setConfigs] = useState(DEFAULT_CONFIG);
  const [initialState, setInitialState] = useState<Partial<GameState>>();

  async function hostStartNewGame(config: Partial<GameConfig>) {
    const finalConfig: GameConfig = { ...DEFAULT_CONFIG, ...config };

    const hostChooseWord = finalConfig.enableHostChooseWord === true;
    let word: WordDictionary | null = null;

    if (!hostChooseWord) {
      [word] = await dictionaryService.getNewRandomWord();
    }

    const initialGameState: GameState = {
      players: [],
      stage: hostChooseWord ? "word_pick" : "fake",
      currentRound: word ? { word, fakes: [] } : null,
      roundHistory: [],
      votes: [],
    };

    await gameSessionService.create({ roomCode: code, configs: finalConfig, initialState: initialGameState });

    setConfigs(finalConfig);
    setInitialState(initialGameState);
    startGame();
  }

  useEffect(() => {
    const loadGameSession = async () => {
      try {
        const session = await gameSessionService.get(code);
        if (session) {
          setConfigs(session.configs as GameConfig);
          setInitialState(session.game_state as GameState);
          startGame();
        }
      } catch (error) {
        console.error("Erro ao carregar sessão de jogo:", error);
      }
    };

    loadGameSession();

    channel
      ?.on("broadcast", { event: "start-game" }, ({ payload }) => {
        setConfigs((curr) => ({ ...curr, ...payload.configs }));
        setInitialState((curr) => ({ ...curr, ...payload.initialState }));
        startGame();
      })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, code])

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
