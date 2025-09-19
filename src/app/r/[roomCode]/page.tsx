import RoomPage from "@/lib/pages/Room/RoomPage";
import { findByCode } from "@/server/services/room/room.service";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ roomCode: string }>
}

export default async function Page({ params }: Props) {
  const roomCode = (await params).roomCode;
  const room = await findByCode(roomCode);

  if (!room) notFound();

  return (
    <RoomPage room={room} />
  )
}