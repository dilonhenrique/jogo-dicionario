import db from "@/infra/db";

export default async function getCurrentRoundId(roomCode: string) {
  const session = await db
    .selectFrom('game_sessions')
    .where('room_code', '=', roomCode)
    .select('current_round_id')
    .executeTakeFirst();

  return session?.current_round_id || null;
}
