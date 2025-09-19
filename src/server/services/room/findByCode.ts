"use server";

import { roomRepo } from "@/server/repositories/room";
import { Room } from "@/types/room";

export default async function findByCode(code: string): Promise<Room | null> {
  const room = await roomRepo.get(code);

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
