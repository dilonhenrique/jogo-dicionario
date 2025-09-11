"use client";

import Container from "@/lib/components/ui/Container/Container";
import { generateRoomCode, isValidRoomCode } from "@/lib/utils/generateRoomCode";
import { Button, Form, Input } from "@heroui/react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

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
        action={(formData) => {
          const { code } = Object.fromEntries(formData);

          if (isValidRoomCode(code)) {
            router.push(`/r/${code}`);
          }
        }}

      >
        <Input
          placeholder="Número da sala"
          name="code"
          validate={(data) => isValidRoomCode(data) ? true : "Código inválido"}
        />
        <Button type="submit">Entrar</Button>
      </Form>

      <Button
        color="primary"
        onPress={createNewRoom}
      >
        Nova sala
      </Button>
    </Container>
  )
}