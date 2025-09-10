import { GameConfig } from "@/types/game";
import { Button, Form, Input } from "@heroui/react";

type Props = {
  startNewGame: (config: GameConfig) => void;
}

export default function RoomSetup({ startNewGame }: Props) {
  return (
    <Form
      action={(formData) => {
        const data = Object.fromEntries(formData);
        startNewGame(data as unknown as GameConfig);
      }}
    >
      <Input name="maxPoints" placeholder="Máximo de pontos" defaultValue="3" />

      <Button type="submit">
        Começar
      </Button>
    </Form>
  )
}