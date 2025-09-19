import { useRoomChannel } from "@/lib/contexts/RoomContext";
import InGame from "../InGame/InGame";
import { GameProvider } from "@/lib/contexts/GameContext";
import { GameState, WordDictionary } from "@/types/game";
import { useEffect, useState } from "react";
import { dictionaryService } from "@/server/services/dictionary";
import RoomPreview from "./RoomPreview";
import { gameSessionService } from "@/server/services/gameSession";
import { addToast } from "@heroui/react";
import { useIsClient } from "usehooks-ts";
import { Crown } from "lucide-react";

export default function Room() {
  const { channel, gameHasStarted, startGame, code, configs, onlinePlayers, amIHost } = useRoomChannel();
  const [initialState, setInitialState] = useState<Partial<GameState>>();
  const isClient = useIsClient();

  async function hostStartNewGame() {
    const hostChooseWord = configs.enableHostChooseWord === true;
    let word: WordDictionary | null = null;

    if (!hostChooseWord) {
      [word] = await dictionaryService.getNewRandomWord();
    }

    const initialGameState: GameState = {
      players: onlinePlayers.map(p => ({ ...p, points: 0 })),
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
          setInitialState(session.game_state as GameState); // TODO: maybe this is wrongly placed
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

  useEffect(() => {
    if (isClient && amIHost) {
      addToast({
        color: "warning",
        title: "Você foi promovido a Host",
        icon: <Crown size={14} />,
        classNames: { icon: "!fill-none" },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amIHost])

  if (gameHasStarted && initialState) {
    return (
      <GameProvider configs={configs} initialState={initialState}>
        <InGame />
      </GameProvider>
    );
  }

  return <RoomPreview onStartGame={hostStartNewGame} />;
}
