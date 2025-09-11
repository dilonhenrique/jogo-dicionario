"use client";

import Room from "@/lib/components/modules/Room/Room";
import Container from "@/lib/components/ui/Container/Container"
import { RoomChannelProvider } from "@/lib/contexts/RoomContext";
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
    <Container className="relative">
      <h1 className="!text-large text-primary my-2">Sala #{code}</h1>

      <Divider className="mb-2" />

      {!isClient
        ? <Spinner />
        : user === null
          ? (
            <Form
              className="flex flex-col"
              action={(formData) => {
                const name = formData.get("name");
                if (typeof name === "string") {
                  // TODO: setar isHost como true quando estiver criando sala
                  setUser({ id: v4(), name, isHost: false })
                }
              }}
            >
              <h5>Identifique-se</h5>
              <Input name="name" placeholder="Seu nome" size="lg" variant="underlined" />
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