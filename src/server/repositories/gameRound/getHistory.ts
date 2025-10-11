import db from "@/infra/db";

export default async function getHistory(roomCode: string) {
  return await db
    .selectFrom('game_rounds')
    .where('room_code', '=', roomCode)
    .where('finished_at', 'is not', null)
    .selectAll()
    .orderBy('round_number', 'asc')
    .execute();
}
