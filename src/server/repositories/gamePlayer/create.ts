import db from "@/infra/db";
import type { NewGamePlayer } from "@/infra/db/types";

export default async function create(player: NewGamePlayer) {
  return await db
    .insertInto('game_players')
    .values(player)
    .returningAll()
    .executeTakeFirst();
}
