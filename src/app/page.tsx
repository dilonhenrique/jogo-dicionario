"use client";

import { Button, Input } from "@heroui/react";

export default function Home() {
  return (
    <div className="flex flex-col gap-4 items-center p-10">
      <h1>Hello World</h1>

      <div className="flex">
        <Input placeholder="Número da sala" />
        <Button>Entrar</Button>
      </div>

      <Button color="primary">Nova sala</Button>
    </div>
  );
}
