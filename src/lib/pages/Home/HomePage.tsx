"use client";

import Container from "@/lib/components/ui/Container/Container";
import { generateRoomCode, isValidRoomCode } from "@/lib/utils/generateRoomCode";
import { Button, Form, Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function createNewRoom() {
    const code = generateRoomCode();
    router.push(`/r/${code}`);
  }

  return (
    <Container>
      <h1>
        Jogo do dicionário
      </h1>

      <Form
        className="flex-row"
        onSubmit={(e) => {
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

      <Button
        color="primary"
        onPress={createNewRoom}
      >
        Criar sala
      </Button>
    </Container>
  )
}