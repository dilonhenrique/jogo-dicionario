import db from "@/infra/db";

export default async function getByRound(roundId: string) {
  return await db
    .selectFrom('game_votes')
    .where('round_id', '=', roundId)
    .selectAll()
    .orderBy('voted_at', 'asc')
    .execute();
}
