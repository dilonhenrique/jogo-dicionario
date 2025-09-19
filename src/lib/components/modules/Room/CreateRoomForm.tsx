import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";
import { useSession } from "@/lib/contexts/SessionContext";
import { generateRoomCode } from "@/lib/utils/generateRoomCode";
import { roomService } from "@/server/services/room";
import { GameConfig } from "@/types/game";
import { Button, Form, Input, Switch } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  onCancel?: () => void;
}

export default function CreateRoomForm({ onCancel }: Props) {
  const router = useRouter();

  const { user, createUser, updateUser } = useSession();
  const [enableMaxPoints, setEnableMaxPoints] = useState(DEFAULT_CONFIG.enableMaxPoints);

  async function createNewRoom(formData: FormData) {
    const name = formData.get("name") as string;
    const data = Object.fromEntries(formData);

    let currentUser = user;
    if (!currentUser) {
      currentUser = createUser({ name });
    } else if (currentUser.name !== name) {
      updateUser({ name });
      currentUser = { ...currentUser, name };
    }

    const configs: GameConfig = {
      enableHostChooseWord: data.enableHostChooseWord === "true",
      enableMaxPoints: data.enableMaxPoints === "true",
      maxPoints: parseInt(data.maxPoints as string) || DEFAULT_CONFIG.maxPoints,
    };

    const roomCode = generateRoomCode();
    await roomService.create({ code: roomCode, host: currentUser, configs });
    router.push(`/r/${roomCode}`);
  }

  return (
    <Form
      className="flex flex-col gap-4 border border-foreground-100 p-4 rounded-xl"
      action={createNewRoom}
    >
      <h5>Criar nova sala</h5>

      <Input
        name="name"
        label="Seu nome"
        placeholder="Digite seu nome"
        defaultValue={user?.name || ""}
        isRequired
      />

      <div className="flex flex-col gap-3">
        <h6>Configurações do jogo</h6>

        <Switch value="true" name="enableHostChooseWord" defaultSelected={DEFAULT_CONFIG.enableHostChooseWord}>
          Host escolhe as palavras
        </Switch>

        <Switch
          value="true"
          name="enableMaxPoints"
          isSelected={enableMaxPoints}
          onValueChange={setEnableMaxPoints}
        >
          Jogo termina com pontuação
        </Switch>

        {enableMaxPoints && (
          <Input
            name="maxPoints"
            label="Máximo de pontos"
            type="number"
            defaultValue={DEFAULT_CONFIG.maxPoints.toString()}
          />
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" color="primary">
          Criar e entrar
        </Button>
        <Button
          variant="ghost"
          onPress={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </Form>
  );
}