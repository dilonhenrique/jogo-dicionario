"use client";

import Room from "@/lib/components/modules/Room/Room";
import Container from "@/lib/components/ui/Container/Container"
import { RoomChannelProvider } from "@/lib/contexts/RoomContext";
import { useSession } from "@/lib/contexts/SessionContext";
import { Room as RoomType } from "@/types/room";
import { Button, Divider, Form, Input, Spinner } from "@heroui/react";
import { useIsClient } from "usehooks-ts";

type Props = {
  room: RoomType;
}

export default function RoomPage({ room }: Props) {
  const { user, createUser } = useSession();
  const isClient = useIsClient();

  return (
    <Container className="relative min-h-dvh">
      <h1 className="!text-large text-primary my-2">Sala #{room.code}</h1>

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
                  createUser({ name });
                }
              }}
            >
              <h5>Identifique-se</h5>
              <Input name="name" placeholder="Seu nome" size="lg" />
              <Button type="submit" color="primary">Entrar</Button>
            </Form>
          )
          : (
            <RoomChannelProvider room={room}>
              <Room />
            </RoomChannelProvider>
          )}
    </Container>
  )
}