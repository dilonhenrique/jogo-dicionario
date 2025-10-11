import db from "@/infra/db";

export default async function kick(roomCode: string, userId: string) {
  return await db
    .updateTable('game_players')
    .set({ kicked_at: new Date().toISOString() })
    .where('room_code', '=', roomCode)
    .where('user_id', '=', userId)
    .returningAll()
    .executeTakeFirst();
}
