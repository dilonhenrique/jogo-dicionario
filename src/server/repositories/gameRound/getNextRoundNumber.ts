import db from "@/infra/db";

export default async function getNextRoundNumber(roomCode: string) {
  const result = await db
    .selectFrom('game_rounds')
    .where('room_code', '=', roomCode)
    .select(db.fn.max('round_number').as('max_round'))
    .executeTakeFirst();

  return (result?.max_round || 0) + 1;
}
