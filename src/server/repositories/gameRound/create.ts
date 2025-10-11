import db from "@/infra/db";
import type { NewGameRound } from "@/infra/db/types";

export default async function create(round: NewGameRound) {
  return await db
    .insertInto('game_rounds')
    .values(round)
    .returningAll()
    .executeTakeFirst();
}
