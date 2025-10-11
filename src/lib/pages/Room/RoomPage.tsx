"use client";

import PageContainer from "@/lib/components/ui/Container/PageContainer";
import { RoomComplete } from "@/types/room";
import { Divider } from "@heroui/react";
import RoomContent from "./RoomContent";

type Props = {
  room: RoomComplete;
}

export default function RoomPage({ room }: Props) {
  return (
    <PageContainer className="relative min-h-dvh pb-36 items-stretch">
      <h1 className="!text-large text-primary my-2">Sala #{room.code}</h1>

      <Divider className="mb-2" />

      <RoomContent room={room} />
    </PageContainer>
  )
}