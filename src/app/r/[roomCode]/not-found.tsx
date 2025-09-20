"use client";

import PageContainer from "@/lib/components/ui/Container/PageContainer";
import { DoorOpen } from "lucide-react";

export default function NotFound() {
  return (
    <PageContainer className="text-center items-center justify-center h-dvh">
      <DoorOpen size={200} strokeWidth={1} className="text-primary" style={{ marginTop: "-10%" }} />
      <h1>Sala não encontrada!</h1>
    </PageContainer>
  )
}