"use client";

import Room from "@/lib/components/modules/Room/Room";
import Container from "@/lib/components/ui/Container/Container"
import { RoomChannelProvider } from "@/lib/contexts/RoomContext";
import { User } from "@/types/user";
import { Button, Form, Input, Spinner } from "@heroui/react";
import { useIsClient, useLocalStorage } from "usehooks-ts";
import { v4 } from "uuid";

type Props = {
  code: string;
}

export default function RoomPage({ code }: Props) {
  const [user, setUser] = useLocalStorage<User | null>('LOCAL_USER', null);
  const isClient = useIsClient();

  return (
    <Container>
      <h1>Sala #{code}</h1>

      {!isClient
        ? <Spinner />
        : user === null
          ? (
            <Form
              action={(formData) => {
                const name = formData.get("name");
                if (typeof name === "string") {
                  setUser({ id: v4(), name, isHost: false })
                }
              }}
            >
              <Input name="name" placeholder="Seu nome" />
              <Button type="submit">Entrar</Button>
            </Form>
          )
          : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <RoomChannelProvider code={code} user={user} setUser={setUser as any}>
              <Room />
            </RoomChannelProvider>
          )}
    </Container>
  )
}