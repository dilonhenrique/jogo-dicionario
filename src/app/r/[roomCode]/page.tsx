import RoomPage from "@/lib/pages/Room/RoomPage";
import { roomService } from "@/server/services/room";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ roomCode: string }>
}

export default async function Page({ params }: Props) {
  const roomCode = (await params).roomCode;
  const room = await roomService.findByCode(roomCode);

  if (!room) notFound();

  return (
    <RoomPage room={room} />
  )
}