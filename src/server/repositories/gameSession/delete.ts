"use server";

import db from "@/infra/db";

export default async function deleteGameSession(roomCode: string) {
  await db
    .deleteFrom("game_sessions")
    .where("room_code", "=", roomCode)
    .execute();
}
