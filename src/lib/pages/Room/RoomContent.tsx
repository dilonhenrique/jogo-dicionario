"use client";

import LoginForm from "@/lib/components/modules/Player/LoginForm";
import Room from "@/lib/components/modules/Room/Room";
import { RoomChannelProvider } from "@/lib/contexts/RoomContext";
import { useSession } from "@/lib/contexts/SessionContext";
import { useGameSync } from "@/lib/hooks/useGameSync";
import { RoomComplete } from "@/types/room";
import { Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useIsClient } from "usehooks-ts";
import { gameService } from "@/server/services/game";

type Props = {
  room: RoomComplete;
}

export default function RoomContent({ room }: Props) {
  const { user } = useSession();
  const isClient = useIsClient();
  const { refetchAll } = useGameSync(room.code);

  const [isCheckingGame, setIsCheckingGame] = useState(true);
  const [amIInThisGame, setAmIInThisGame] = useState(true);

  useEffect(() => {
    const checkGameMembership = async () => {
      if (!user) {
        setIsCheckingGame(false);
        return;
      }

      setIsCheckingGame(true);

      try {
        const players = await gameService.getPlayers(room.code);
        if (players.length > 0) {
          const isMember = players.some(p => p.id === user.id);
          setAmIInThisGame(isMember);
        }
      } catch (error) {
        console.error("Erro ao verificar participação no jogo:", error);
      } finally {
        setIsCheckingGame(false);
      }
    };

    checkGameMembership();
  }, [room.code, user]);

  if (!isClient || isCheckingGame) {
    return <Spinner size="sm" />;
  }

  if (user === null) {
    return <LoginForm />;
  }

  if (!amIInThisGame) {
    return (
      <>
        <p>Este jogo já começou (sem você)</p>
        <Button as={Link} href="/">Página inicial</Button>
      </>
    );
  }

  return (
    <RoomChannelProvider room={room} refetchGame={refetchAll}>
      <Room />
    </RoomChannelProvider>
  );
}