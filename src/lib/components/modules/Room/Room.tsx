import { useRoomChannel } from "@/lib/contexts/RoomContext";
import InGame from "../InGame/InGame";
import { GameProvider } from "@/lib/contexts/GameContext";
import { GameState, WordDictionary } from "@/types/game";
import { useEffect, useState } from "react";
import { dictionaryService } from "@/server/services/dictionary";
import RoomPreview from "./RoomPreview";
import { gameSessionService } from "@/server/services/gameSession";

export default function Room() {
  const { channel, gameHasStarted, startGame, code, configs } = useRoomChannel();
  const [initialState, setInitialState] = useState<Partial<GameState>>();

  async function hostStartNewGame() {
    const hostChooseWord = configs.enableHostChooseWord === true;
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

    await gameSessionService.create({ 
      roomCode: code, 
      initialState: initialGameState 
    });

    setInitialState(initialGameState);
    startGame();
  }

  useEffect(() => {
    const loadGameSession = async () => {
      try {
        const session = await gameSessionService.get(code);
        if (session) {
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
        setInitialState((curr) => ({ ...curr, ...payload.initialState }));
        startGame();
      });
  }, [channel, code, startGame]);

  if (gameHasStarted && initialState) {
    return (
      <GameProvider configs={configs} initialState={initialState}>
        <InGame />
      </GameProvider>
    );
  }

  return <RoomPreview onStartGame={hostStartNewGame} />;
}
