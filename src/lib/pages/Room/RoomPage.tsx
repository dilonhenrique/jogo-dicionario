"use client";

import Room from "@/lib/components/modules/Room/Room";
import Container from "@/lib/components/ui/Container/Container"
import { RoomChannelProvider } from "@/lib/contexts/RoomContext";
import { useSession } from "@/lib/contexts/SessionContext";
import { createRoom } from "@/server/services/room/room.service";
import { Button, Divider, Form, Input, Spinner } from "@heroui/react";
import { useIsClient } from "usehooks-ts";

type Props = {
  code: string;
}

export default function RoomPage({ code }: Props) {
  const { user, createUser } = useSession();
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
                  const user = createUser({ name, isHost: true })// this is probably wrong

                  try {
                    await createRoom({ code, host: user });
                  } catch (error) {
                    console.log("Sala já existe ou erro ao criar:", error);
                  }
                }
              }}
            >
              <h5>Identifique-se</h5>
              <Input name="name" placeholder="Seu nome" size="lg" />
              <Button type="submit" color="primary">Entrar</Button>
            </Form>
          )
          : (
            <RoomChannelProvider code={code}>
              <Room />
            </RoomChannelProvider>
          )}
    </Container>
  )
}