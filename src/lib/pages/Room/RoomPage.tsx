"use client";

import Room from "@/lib/components/section/Room/Room";
import Container from "@/lib/components/ui/Container/Container"
import { User } from "@/types/user";
import { Button, Form, Input } from "@heroui/react";
import { useLocalStorage } from "usehooks-ts";
import { v4 } from "uuid";

type Props = {
  code: string;
}

export default function RoomPage({ code }: Props) {
  const [user, setUser] = useLocalStorage<User | null>('LOCAL_USER', null);

  return (
    <Container>
      <h1>Sala #{code}</h1>

      {user === null
        ? (
          <Form
            action={(formData) => {
              const name = formData.get("name");
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
          <Room code={code} user={user} />
        )}
    </Container>
  )
}