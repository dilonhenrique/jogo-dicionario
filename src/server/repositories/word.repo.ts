"use server";

import db from "@/infra/db";
import { DifficultyLevel, PosTag, Word } from "@/infra/db/types";
import { sql } from "kysely";

type PickOpts = {
  difficulties: DifficultyLevel[];
  limit?: number;
  pos?: PosTag[];
};

export async function pickRandomWord(opts: PickOpts): Promise<Word[]> {
  const {
    limit = 1,
    pos = ["adj", "verb", "noun"],
    difficulties
  } = opts;

  let q = db
    .selectFrom("words as w")
    .innerJoin("word_scores as s", "s.word_id", "w.id")
    .selectAll("w")
    .where("w.difficulty", "in", difficulties)
    .where("s.dislikes", "=", 0)
    .where("w.definition", "is not", null)
    .where("w.definition", "!=", "")
    .where("s.dislikes", "=", 0);

  if (pos) q = q.where("w.pos", "in", pos);

  return await q.orderBy(sql`random()`).limit(limit).execute();
}
