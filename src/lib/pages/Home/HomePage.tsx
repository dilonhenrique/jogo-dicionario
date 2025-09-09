"use client";

import Container from "@/lib/components/ui/Container/Container";
import { joinRoomChannel } from "@/lib/hooks/useRealtimeRoom";
import { generateRoomCode } from "@/lib/utils/generateRoomCode";
import { Button, Input } from "@heroui/react";

export default function HomePage() {
  return (
    <Container>
      Home

      <div className="flex">
        <Input placeholder="Número da sala" />
        <Button>Entrar</Button>
      </div>

      <Button
        color="primary"
        onPress={() => {
          const { channel, sendMove } = joinRoomChannel(generateRoomCode());
          console.log(channel)
          sendMove({ said: "Oh yeah!" });
        }}
      >
        Nova sala
      </Button>
    </Container>
  )
}