import { ws } from "@/infra/ws";
import { User } from "@/types/user";

type Props = {
  code: string;
  user: User;
}

export default function joinRoomChannel({ code, user }: Props) {
  return ws.channel(`room:${code}`, {
    config: { presence: { key: user.id, enabled: true }, }
  });
}
