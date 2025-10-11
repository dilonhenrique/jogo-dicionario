import db from "@/infra/db";

export default async function getOpenRounds(roomCode: string) {
  return await db
    .selectFrom('game_rounds')
    .where('room_code', '=', roomCode)
    .where('finished_at', 'is', null)
    .selectAll()
    .execute();
}
