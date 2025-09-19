"use server";

import db from "@/infra/db";
import { GameConfig } from "@/types/game";

export default async function updateConfigs(roomCode: string, configs: GameConfig) {
  await db
    .updateTable("game_sessions")
    .set({
      configs,
      updated_at: new Date(),
    })
    .where("room_code", "=", roomCode)
    .execute();
}
