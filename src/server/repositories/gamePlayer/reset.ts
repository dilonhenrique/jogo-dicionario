import db from "@/infra/db";

export default async function reset(roomCode: string) {
  return await db
    .updateTable('game_players')
    .set({ points: 0 })
    .where('room_code', '=', roomCode)
    .execute();
}
