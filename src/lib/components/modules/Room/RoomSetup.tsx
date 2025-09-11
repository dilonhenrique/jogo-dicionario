import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { GameConfig } from "@/types/game";
import { Button, Form, Input, Switch } from "@heroui/react";
import { useState } from "react";

type Props = {
  hostStartNewGame: (config: GameConfig) => void;
}

export default function RoomSetup({ hostStartNewGame }: Props) {
  const { onlinePlayers } = useRoomChannel();

  const [enableMaxPoints, setEnableMaxPoints] = useState(DEFAULT_CONFIG.enableMaxPoints)

  return (
    <Form
      className="border border-foreground-100 p-4 pb-6 rounded-xl gap-4"
      action={(formData) => {
        const data = Object.fromEntries(formData);
        hostStartNewGame({
          enableHostChooseWord: data.enableHostChooseWord === "true",
          enableMaxPoints: data.enableMaxPoints === "true",
          maxPoints: parseInt(data.maxPoints as string),
        });
      }}
    >
      <h5>Configurações</h5>
      <Switch value="true" name="enableHostChooseWord" defaultSelected={DEFAULT_CONFIG.enableHostChooseWord}>
        Host escolhe as palavras
      </Switch>

      <Switch value="true" name="enableMaxPoints" isSelected={enableMaxPoints} onValueChange={setEnableMaxPoints}>
        Jogo termina com pontuação
      </Switch>

      {enableMaxPoints &&
        <Input name="maxPoints" label="Máximo de pontos" defaultValue={DEFAULT_CONFIG.maxPoints.toString()} />}

      <Button type="submit" isDisabled={onlinePlayers.length < 2} color="primary">
        Começar
      </Button>
    </Form>
  )
}