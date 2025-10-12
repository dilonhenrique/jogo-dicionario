import { useRoomChannel } from "@/lib/contexts/RoomContext";
import InGame from "../InGame/InGame";
import { GameProvider } from "@/lib/contexts/GameContext";
import { useEffect } from "react";
import { dictionaryService } from "@/server/services/dictionary";
import RoomPreview from "./RoomPreview";
import { gameSessionService } from "@/server/services/gameSession";
import { gameActions } from "@/server/actions/game";
import { addToast } from "@heroui/react";
import { useIsClient } from "usehooks-ts";
import { Crown } from "lucide-react";

export default function Room() {
  const { gameHasStarted, startGame, code, configs, onlinePlayers, amIHost } = useRoomChannel();
  const isClient = useIsClient();

  async function hostStartNewGame() {
    const hostChooseWord = configs.enableHostChooseWord === true;

    await gameSessionService.create({
      roomCode: code,
      initialState: {
        players: [],
        stage: hostChooseWord ? "word_pick" : "fake",
        currentRound: null,
        roundHistory: [],
        votes: [],
      }
    });

    for (const player of onlinePlayers) {
      await gameActions.joinGame({
        roomCode: code,
        userId: player.id,
        userName: player.name,
      });
    }

    if (!hostChooseWord) {
      const [word] = await dictionaryService.getNewRandomWord();
      await gameActions.setWordAndStartFake({
        roomCode: code,
        word,
      });
    }

    startGame();
  }

  useEffect(() => {
    const loadGameSession = async () => {
      try {
        const session = await gameSessionService.get(code);
        if (session) {
          startGame();
        }
      } catch (error) {
        console.error("Erro ao carregar sessão de jogo:", error);
      }
    };

    loadGameSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

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

  if (gameHasStarted) {
    return (
      <GameProvider configs={configs}>
        <InGame />
      </GameProvider>
    );
  }

  return <RoomPreview onStartGame={hostStartNewGame} />;
}
