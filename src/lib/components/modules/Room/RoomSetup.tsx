import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { GameConfig } from "@/types/game";
import { Button, Form, Input, Switch } from "@heroui/react";
import { Info } from "lucide-react";
import { useState } from "react";
import HostControls from "./HostControls";

type Props = {
  hostStartNewGame: (config: GameConfig) => void;
}

export default function RoomSetup({ hostStartNewGame }: Props) {
  const { onlinePlayers } = useRoomChannel();

  const [enableMaxPoints, setEnableMaxPoints] = useState(DEFAULT_CONFIG.enableMaxPoints)

  return (
    <>
      <HostControls />
      
      <Form
        className="border border-foreground-100 p-4 rounded-xl gap-4"
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
          <Input name="maxPoints" label="Máximo de pontos" defaultValue={DEFAULT_CONFIG.maxPoints.toString()} />
        }

        <p className="text-sm">Em breve: escolha categorias de palavras</p>

        <div className="flex flex-col gap-2 items-start">
          <Button type="submit" isDisabled={onlinePlayers.length < 2} color="primary">
            Começar
          </Button>

          <p className="text-xs text-foreground-500 italic flex items-start gap-1 ms-1">
            <Info size={14} />
            Depois de iniciada a partida, nenhum jogador pode entrar
          </p>
        </div>
      </Form>
    </>
  )
}