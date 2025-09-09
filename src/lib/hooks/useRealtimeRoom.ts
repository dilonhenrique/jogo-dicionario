import { supabase } from "@/infra/supabase";

export function joinRoomChannel(roomCode: string) {
  const channel = supabase.channel(`room:${roomCode}`);

  channel.on("broadcast", { event: "move" }, (payload) => {
    console.log(payload);
  });

  const sendMove = (data: any) =>
    channel.send({ type: "broadcast", event: "move", payload: data });

  channel.subscribe();

  return { channel, sendMove };
}
