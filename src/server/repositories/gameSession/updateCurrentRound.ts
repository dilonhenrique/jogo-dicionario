import db from "@/infra/db";

export default async function updateCurrentRound(roomCode: string, roundId: string | null) {
  return await db
    .updateTable('game_sessions')
    .set({ current_round_id: roundId })
    .where('room_code', '=', roomCode)
    .returningAll()
    .executeTakeFirst();
}
