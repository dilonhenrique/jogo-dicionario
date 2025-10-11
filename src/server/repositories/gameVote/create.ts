import db from "@/infra/db";
import type { NewGameVote } from "@/infra/db/types";

export default async function create(vote: NewGameVote) {
  return await db
    .insertInto('game_votes')
    .values(vote)
    .onConflict((oc) => oc
      .columns(['round_id', 'user_id'])
      .doUpdateSet({
        definition_id: vote.definition_id,
        is_real_word: vote.is_real_word,
      })
    )
    .returningAll()
    .executeTakeFirst();
}
