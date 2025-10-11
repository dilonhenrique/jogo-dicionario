import db from "@/infra/db";

export default async function updatePoints(roomCode: string, userId: string, points: number) {
  return await db
    .updateTable('game_players')
    .set({ points })
    .where('room_code', '=', roomCode)
    .where('user_id', '=', userId)
    .returningAll()
    .executeTakeFirst();
}
