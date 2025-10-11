import db from "@/infra/db";

export default async function getByRound(roundId: string) {
  return await db
    .selectFrom('game_fake_definitions')
    .where('round_id', '=', roundId)
    .selectAll()
    .orderBy('created_at', 'asc')
    .execute();
}
