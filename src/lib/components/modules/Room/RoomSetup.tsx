import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { GameConfig } from "@/types/game";
import { Button, Form, Input } from "@heroui/react";

type Props = {
  hostStartNewGame: (config: GameConfig) => void;
}

export default function RoomSetup({ hostStartNewGame }: Props) {
  const { onlinePlayers } = useRoomChannel();

  return (
    <Form
      action={(formData) => {
        const data = Object.fromEntries(formData);
        hostStartNewGame(data as unknown as GameConfig);
      }}
    >
      <Input name="maxPoints" label="Máximo de pontos" defaultValue={DEFAULT_CONFIG.maxPoints.toString()} />

      <Button type="submit" isDisabled={onlinePlayers.length < 2}>
        Começar
      </Button>
    </Form>
  )
}