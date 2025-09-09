"use client";

import Container from "@/lib/components/ui/Container/Container";
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
          
        }}
      >
        Nova sala
      </Button>
    </Container>
  )
}