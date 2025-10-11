import db from "@/infra/db";

export default async function remove(roundId: string, userId: string) {
  return await db
    .deleteFrom('game_votes')
    .where('round_id', '=', roundId)
    .where('user_id', '=', userId)
    .returningAll()
    .executeTakeFirst();
}
