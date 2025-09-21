"use client";

import Room from "@/lib/components/modules/Room/Room";
import PageContainer from "@/lib/components/ui/Container/PageContainer";
import { RoomChannelProvider } from "@/lib/contexts/RoomContext";
import { useSession } from "@/lib/contexts/SessionContext";
import { RoomComplete } from "@/types/room";
import { addToast, Button, Divider, Form, Input, Spinner } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { useIsClient } from "usehooks-ts";

type Props = {
  room: RoomComplete;
}

export default function RoomPage({ room }: Props) {
  const { user, createUser } = useSession();
  const isClient = useIsClient();

  const amIInThisGame = !room.session || room.session.players.some(u => u.id === user?.id);

  return (
    <PageContainer className="relative min-h-dvh pb-40">
      <h1 className="!text-large text-primary my-2">Sala #{room.code}</h1>

      <Divider className="mb-2" />

      {!isClient
        ? <Spinner />
        : !amIInThisGame
          // TODO: improve this ifs
          ? <p>O jogo já começou sem você</p>
          : user === null
            ? (
              <Form
                className="flex flex-col"
                action={async (formData) => {
                  const name = formData.get("name");
                  if (typeof name === "string" && name.length > 3) {
                    createUser({ name });
                  } else {
                    addToast({
                      color: "danger",
                      title: "Nome inválido",
                    })
                  }
                }}
              >
                <h4>Identifique-se para entrar</h4>

                <div className="flex gap-2 w-full">
                  <Input name="name" placeholder="Seu nome" size="lg" />
                  <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    endContent={<ArrowRight className="shrink-0" size={18} />}
                  >
                    Entrar
                  </Button>
                </div>
              </Form>
            )
            : (
              <RoomChannelProvider room={room}>
                <Room />
              </RoomChannelProvider>
            )}
    </PageContainer>
  )
}