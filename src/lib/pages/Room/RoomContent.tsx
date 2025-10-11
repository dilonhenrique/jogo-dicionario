"use client";

import LoginForm from "@/lib/components/modules/Player/LoginForm";
import Room from "@/lib/components/modules/Room/Room";
import { RoomChannelProvider } from "@/lib/contexts/RoomContext";
import { useSession } from "@/lib/contexts/SessionContext";
import { RoomComplete } from "@/types/room";
import { Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useIsClient } from "usehooks-ts";

type Props = {
  room: RoomComplete;
}

export default function RoomContent({ room }: Props) {
  const { user } = useSession();
  const isClient = useIsClient();

  const amIInThisGame = !room.session || room.session.players.some(u => u.id === user?.id);

  if (!isClient) {
    return <Spinner size="sm" />;
  }

  if (!amIInThisGame) {
    return (
      <>
        <p>Este jogo já começou (sem você)</p>
        <Button as={Link} href="/">Página inicial</Button>
      </>
    );
  }

  if (user === null) {
    return <LoginForm />;
  }

  return (
    <RoomChannelProvider room={room}>
      <Room />
    </RoomChannelProvider>
  );
}