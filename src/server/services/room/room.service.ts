import { ws } from "@/infra/ws";
import { User } from "@/types/user";
import { getRoom } from "@/server/repositories/room.repo";
import { Room } from "@/types/room";

type Props = {
  code: string;
  user: User;
}

export function joinRoomChannel({ code, user }: Props) {
  const channel = ws
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

export async function findByCode(code: string): Promise<Room | null> {
  const room = await getRoom(code);

  if (!room) return null;

  return {
    code: room.code,
    host: {
      id: room.host_user_id,
      name: room.host_user_name,
    },
    createdAt: room.created_at,
    expiresAt: room.expires_at,
  };
}

export {
  createRoom,
  transferHost,
  extendRoomExpiration,
  isHostOfRoom,
  getRoomsByHost,
  deleteRoom,
  cleanupExpiredRooms,
} from "@/server/repositories/room.repo";
