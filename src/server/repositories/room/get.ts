"use server";

import db from "@/infra/db";
import { RoomComplete } from "@/infra/db/types";

export default async function get(code: string): Promise<RoomComplete | undefined> {
  return await db
    .selectFrom("rooms")
    .leftJoin("game_sessions", "game_sessions.room_code", "rooms.code")
    .select([
      "code",
      "host_user_id",
      "host_user_name",
      "configs",
      "rooms.expires_at",
      "rooms.created_at",
      "game_sessions.game_state"
    ])
    .where("code", "=", code)
    .where("expires_at", ">", new Date())
    .executeTakeFirst();
}
