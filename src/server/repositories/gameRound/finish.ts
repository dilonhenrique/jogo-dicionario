import db from "@/infra/db";

export default async function finish(roundId: string) {
  return await db
    .updateTable('game_rounds')
    .set({ finished_at: new Date().toISOString() })
    .where('id', '=', roundId)
    .returningAll()
    .executeTakeFirst();
}
