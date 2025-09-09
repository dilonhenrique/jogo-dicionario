import RoomPage from "@/lib/pages/Room/RoomPage";
import { isValidRoomCode } from "@/lib/utils/generateRoomCode";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ roomCode: string }>
}

export default async function Page({ params }: Props) {
  const roomCode = (await params).roomCode;
  const isValid = isValidRoomCode(roomCode);

  if (!isValid) notFound();

  return (
    <RoomPage code={roomCode} />
  )
}