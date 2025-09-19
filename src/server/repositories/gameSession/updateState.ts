"use server";

import db from "@/infra/db";
import { GameState } from "@/types/game";

export default async function updateState(roomCode: string, state: GameState) {
  await db
    .updateTable("game_sessions")
    .set({
      game_state: state,
      updated_at: new Date(),
    })
    .where("room_code", "=", roomCode)
    .execute();
}
