"use client";

import Room from "@/lib/components/modules/Room/Room";
import Container from "@/lib/components/ui/Container/Container"
import { RoomChannelProvider } from "@/lib/contexts/RoomContext";
import { createRoom } from "@/server/services/room/room.service";
import { User } from "@/types/user";
import { Button, Divider, Form, Input, Spinner } from "@heroui/react";
import { useIsClient, useLocalStorage } from "usehooks-ts";
import { v4 } from "uuid";

type Props = {
  code: string;
}

export default function RoomPage({ code }: Props) {
  const [user, setUser] = useLocalStorage<User | null>('LOCAL_USER', null);
  const isClient = useIsClient();

  return (
    <Container className="relative min-h-dvh">
      <h1 className="!text-large text-primary my-2">Sala #{code}</h1>

      <Divider className="mb-2" />

      {!isClient
        ? <Spinner />
        : user === null
          ? (
            <Form
              className="flex flex-col"
              action={async (formData) => {
                const name = formData.get("name");
                if (typeof name === "string") {
                  const userId = v4();

                  try {
                    await createRoom(code, userId, name);
                  } catch (error) {
                    console.log("Sala já existe ou erro ao criar:", error);
                  }

                  setUser({ id: userId, name, isHost: true })
                }
              }}
            >
              <h5>Identifique-se</h5>
              <Input name="name" placeholder="Seu nome" size="lg" />
              <Button type="submit" color="primary">Entrar</Button>
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