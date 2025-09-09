"use client";

import { RoomPlayers } from "@/lib/components/section/Room/RoomPlayers";
import Container from "@/lib/components/ui/Container/Container"
import { RoomChannelProvider } from "@/lib/contexts/RoomContext"
import { User } from "@/types/user";
import { Button, Form, Input } from "@heroui/react";
import { useState } from "react";
import { v4 } from "uuid";

type Props = {
  code: string;
}

export default function RoomPage({ code }: Props) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <Container>
      <h1>Sala #{code}</h1>

      {user === null
        ? (
          <Form
            action={(formData) => {
              const name = formData.get("name");
              console.log(name)
              if (typeof name === "string") {
                setUser({ id: v4(), name })
              }
            }}
          >
            <Input name="name" placeholder="Seu nome" />
            <Button type="submit">Entrar</Button>
          </Form>
        )
        : (
          <RoomChannelProvider code={code} user={user}>
            <RoomPlayers />
          </RoomChannelProvider>
        )}
    </Container>
  )
}