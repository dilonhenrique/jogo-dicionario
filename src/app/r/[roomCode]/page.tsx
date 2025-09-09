import RoomPage from "@/lib/pages/Room/RoomPage";
import { isValidRoomCode } from "@/lib/utils/generateRoomCode";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    roomCode: string;
  }>
}

export default async function Page({ params }: Props) {
  const isValid = isValidRoomCode((await params).roomCode);

  if (!isValid) notFound();

  return (
    <RoomPage />
  )
}