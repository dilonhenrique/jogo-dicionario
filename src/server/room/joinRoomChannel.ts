import { supabase } from "@/infra/supabase";
import { User } from "@/types/user";

type Props = {
  code: string;
  user: User;
}

export function joinRoomChannel({ code, user }: Props) {
  const channel = supabase.channel(`room:${code}`, {
    config: { presence: { key: user.id, enabled: true }, }
  }).subscribe(async (status) => {
    if (status !== 'SUBSCRIBED') { return }
    const presenceTrackStatus = await channel.track({ ...user, onlineAt: new Date().toISOString() });
    console.log(presenceTrackStatus)
  });

  return channel;
}
