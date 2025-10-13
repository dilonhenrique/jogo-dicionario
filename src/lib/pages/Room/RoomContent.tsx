"use client";

import LoginForm from "@/lib/components/modules/Player/LoginForm";
import Room from "@/lib/components/modules/Room/Room";
import { useSessionOptional } from "@/lib/contexts/SessionContext";
import { RoomComplete } from "@/types/room";
import { Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useIsClient } from "usehooks-ts";

type Props = {
  room: RoomComplete;
}

export default function RoomContent({ room }: Props) {
  const { user } = useSessionOptional();
  const isClient = useIsClient();

  const canIJoinTheGame = !room.session || room.session.players.some(p => p.id === user?.id);

  if (!isClient) {
    return <Spinner size="sm" />;
  }

  if (user === null) {
    return <LoginForm />;
  }

  if (!canIJoinTheGame) {
    return (
      <>
        <p>Este jogo já começou (sem você)</p>
        <Button as={Link} href="/">Página inicial</Button>
      </>
    );
  }

  return <Room />;
}