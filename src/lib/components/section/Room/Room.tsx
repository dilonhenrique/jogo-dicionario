import { RoomChannelProvider } from "@/lib/contexts/RoomContext";
import { User } from "@/types/user";
import { RoomPlayers } from "./RoomPlayers";

type Props = {
  code: string;
  user: User;
}

export default function Room({ code, user }: Props) {
  return <RoomChannelProvider code={code} user={user}>
    <RoomPlayers />
  </RoomChannelProvider>
}