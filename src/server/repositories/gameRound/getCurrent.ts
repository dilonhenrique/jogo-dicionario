import db from "@/infra/db";

export default async function getCurrent(roomCode: string) {
  const session = await db
    .selectFrom('game_sessions')
    .where('room_code', '=', roomCode)
    .select('current_round_id')
    .executeTakeFirst();

  if (!session?.current_round_id) {
    return null;
  }

  return await db
    .selectFrom('game_rounds')
    .where('id', '=', session.current_round_id)
    .selectAll()
    .executeTakeFirst();
}
