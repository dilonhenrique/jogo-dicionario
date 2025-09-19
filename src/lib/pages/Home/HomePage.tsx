"use client";

import Container from "@/lib/components/ui/Container/Container";
import { isValidRoomCode } from "@/lib/utils/generateRoomCode";
import { addToast, Button, Divider, Form, Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CreateRoomForm from "@/lib/components/modules/Room/CreateRoomForm";
import { roomService } from "@/server/services/room";

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <Container>
      <h1>
        Jogo do dicionário
      </h1>

      <Form
        className="flex-row"
        onSubmit={async (e) => {
          e.preventDefault();

          const isValid = isValidRoomCode(code);

          if (isValid) {
            const room = await roomService.findByCode(code);

            if (room) {
              router.push(`/r/${room.code}`);
              return;
            }
          }

          addToast({
            color: "danger",
            title: isValid ? "Esta sala não existe" : "Código da sala inválido"
          });
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

      <Divider />

      {!showCreateForm ? (
        <Button
          color="primary"
          onPress={() => setShowCreateForm(true)}
        >
          Criar sala
        </Button>
      ) : (
        <CreateRoomForm onCancel={() => setShowCreateForm(false)} />
      )}
    </Container>
  )
}