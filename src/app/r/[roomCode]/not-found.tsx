"use client";

import Container from "@/lib/components/ui/Container/Container";
import { DoorOpen } from "lucide-react";

export default function NotFound() {
  return (
    <Container className="text-center items-center justify-center h-dvh">
      <DoorOpen size={200} strokeWidth={1} className="text-primary" style={{ marginTop: "-10%" }} />
      <h1>Sala não encontrada!</h1>
    </Container>
  )
}