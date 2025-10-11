import db from "@/infra/db";

export default async function remove(roundId: string, authorUserId: string) {
  return await db
    .deleteFrom('game_fake_definitions')
    .where('round_id', '=', roundId)
    .where('author_user_id', '=', authorUserId)
    .returningAll()
    .executeTakeFirst();
}
