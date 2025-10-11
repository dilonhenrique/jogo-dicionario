import db from "@/infra/db";
import type { GameStage } from "@/types/game";

export default async function updateStage(roomCode: string, stage: GameStage) {
  return await db
    .updateTable('game_sessions')
    .set({ stage })
    .where('room_code', '=', roomCode)
    .returningAll()
    .executeTakeFirst();
}
