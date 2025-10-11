import db from "@/infra/db";
import type { NewGameFakeDefinition } from "@/infra/db/types";

export default async function create(fakeDef: NewGameFakeDefinition) {
  return await db
    .insertInto('game_fake_definitions')
    .values(fakeDef)
    .onConflict((oc) => oc
      .columns(['round_id', 'author_user_id'])
      .doUpdateSet({ definition: fakeDef.definition })
    )
    .returningAll()
    .executeTakeFirst();
}
