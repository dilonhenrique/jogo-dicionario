import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { Button } from "@heroui/react";

export default function GameSetup() {
  const { startGame } = useRoomChannel();

  return <div>
    <Button onPress={startGame}>
      Começar
    </Button>
  </div>
}