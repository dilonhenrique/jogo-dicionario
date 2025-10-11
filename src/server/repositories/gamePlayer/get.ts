import db from "@/infra/db";

export default async function get(roomCode: string) {
  return await db
    .selectFrom('game_players')
    .where('room_code', '=', roomCode)
    .where('kicked_at', 'is', null)
    .selectAll()
    .orderBy('joined_at', 'asc')
    .execute();
}
