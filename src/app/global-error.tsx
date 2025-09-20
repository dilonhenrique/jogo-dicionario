"use client";

import Container from "@/lib/components/ui/Container/Container";

export default function ErrorPage() {
  return (
    <Container className="text-center items-center justify-center h-dvh">
      <h1>Ops!</h1>
      <p>Algo deu errado...</p>
    </Container>
  )
}