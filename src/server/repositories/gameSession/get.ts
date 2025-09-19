"use server";

import db from "@/infra/db";
import { GameSession } from "@/infra/db/types";

export default async function get(roomCode: string): Promise<GameSession | undefined> {
  return await db
    .selectFrom("game_sessions")
    .selectAll()
    .where("room_code", "=", roomCode)
    .executeTakeFirst();
}
