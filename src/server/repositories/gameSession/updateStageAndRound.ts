import db from "@/infra/db";
import type { GameStage } from "@/types/game";

export default async function updateStageAndRound(
  roomCode: string, 
  stage: GameStage, 
  roundId: string | null
) {
  return await db
    .updateTable('game_sessions')
    .set({ 
      stage,
      current_round_id: roundId,
    })
    .where('room_code', '=', roomCode)
    .returningAll()
    .executeTakeFirst();
}
