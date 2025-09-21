"use server";

import { roomRepo } from "@/server/repositories/room";
import { RoomComplete } from "@/types/room";
import { GameConfig, GameState } from "@/types/game";

export default async function get(code: string): Promise<RoomComplete | null> {
  const room = await roomRepo.get(code);

  if (!room) return null;

  return {
    code: room.code,
    host: {
      id: room.host_user_id,
      name: room.host_user_name,
    },
    configs: room.configs as GameConfig,
    createdAt: room.created_at,
    expiresAt: room.expires_at,
    session: room.game_state as GameState | undefined,
  };
}
