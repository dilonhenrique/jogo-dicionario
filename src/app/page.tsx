"use client";

import { joinRoomChannel } from "@/lib/hooks/useRealtimeRoom";
import { generateRoomCode } from "@/lib/utils/generateRoomCode";
import { Button, Input } from "@heroui/react";

export default function Home() {
  return (
    <div className="flex flex-col gap-4 items-center p-10">
      <h1>Hello World</h1>

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
    </div>
  );
}
