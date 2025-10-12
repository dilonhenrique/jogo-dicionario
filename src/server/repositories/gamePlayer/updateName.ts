import db from "@/infra/db";

export default async function updatePoints(roomCode: string, userId: string, name: string) {
  return await db
    .updateTable('game_players')
    .set({ user_name: name })
    .where('room_code', '=', roomCode)
    .where('user_id', '=', userId)
    .returningAll()
    .executeTakeFirst();
}
