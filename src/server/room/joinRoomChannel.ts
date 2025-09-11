import { supabase } from "@/infra/supabase";
import { User } from "@/types/user";

type Props = {
  code: string;
  user: User;
}

export function joinRoomChannel({ code, user }: Props) {
  const channel = supabase
    .channel(`room:${code}`, {
      config: { presence: { key: user.id, enabled: true }, }
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          ...user,
          isHost: false,
          onlineAt: new Date().toISOString(),
        });
      }
    });

  return channel;
}
