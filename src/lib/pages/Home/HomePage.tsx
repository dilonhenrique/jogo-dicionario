"use client";

import Container from "@/lib/components/ui/Container/Container";
import { useSession } from "@/lib/contexts/SessionContext";
import { generateRoomCode, isValidRoomCode } from "@/lib/utils/generateRoomCode";
import { roomService } from "@/server/services/room";
import { Button, Form, Input, Switch } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";
import { GameConfig } from "@/types/game";

export default function HomePage() {
  const { user, createUser, updateUser } = useSession();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
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
    <Container>
      <h1>
        Jogo do dicionário
      </h1>

      <Form
        className="flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          if (isValidRoomCode(code)) {
            router.push(`/r/${code}`);
          }
        }}
      >
        <Input
          placeholder="Código da sala"
          name="code"
          validate={(data) => isValidRoomCode(data) ? true : "Código inválido"}
          value={code}
          onValueChange={setCode}
        />
        <Button type="submit" isDisabled={!isValidRoomCode(code)}>Entrar</Button>
      </Form>

      {!showCreateForm ? (
        <Button
          color="primary"
          onPress={() => setShowCreateForm(true)}
        >
          Criar sala
        </Button>
      ) : (
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
              onPress={() => setShowCreateForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </Form>
      )}
    </Container>
  )
}