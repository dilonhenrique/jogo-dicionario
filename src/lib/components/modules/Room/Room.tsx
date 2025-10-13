import { useRoomChannel } from "@/lib/contexts/RoomContext";
import InGame from "../InGame/InGame";
import { useGameSafe } from "@/lib/contexts/GameContext";
import { useEffect } from "react";
import RoomPreview from "./RoomPreview";
import { gameSessionService } from "@/server/services/gameSession";
import { addToast } from "@heroui/react";
import { useIsClient } from "usehooks-ts";
import { Crown } from "lucide-react";

export default function Room() {
  const { code, configs, onlinePlayers, amIHost, amIConnected } = useRoomChannel();
  const game = useGameSafe();
  const isClient = useIsClient();

  async function hostStartNewGame() {
    if (game.hasStarted) return;

    await gameSessionService.create({
      roomCode: code,
      players: onlinePlayers.map(p => ({ id: p.id, name: p.name })),
      hostChooseWord: configs.enableHostChooseWord === true,
    });

    game.start();
  }

  useEffect(() => {
    const loadGameSession = async () => {
      if (game.hasStarted) return;

      try {
        const session = await gameSessionService.get(code);
        if (session) {
          game.start();
        }
      } catch (error) {
        console.error("Erro ao carregar sessão de jogo:", error);
      }
    };

    loadGameSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, amIConnected]);

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

  if (game.hasStarted) {
    return <InGame />;
  }

  return <RoomPreview onStartGame={hostStartNewGame} />;
}
