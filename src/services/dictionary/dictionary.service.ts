"use server";

import db from "@/infra/db";
import { DifficultyLevel, PosTag, Words } from "@/infra/db/types";
import { WordDictionary } from "@/types/game";
import { sql } from "kysely";
import { capitalize } from "lodash";

export async function getNewRandomWord(quantity = 1): Promise<WordDictionary[]> {
  const random = await pickRandomWord({ difficulties: ["insane"], limit: quantity });

  return random.map(w => ({
    id: w.id,
    label: capitalize(w.word),
    definition: w.definition,
  }));
}

type PickOpts = {
  difficulties: DifficultyLevel[];
  limit?: number;
  lang?: string;
  pos?: PosTag;
};

export async function pickRandomWord(opts: PickOpts): Promise<Words[]> {
  const { limit = 1, difficulties, lang, pos } = opts;

  let q = db
    .selectFrom("words as w")
    .innerJoin("word_scores as s", "s.word_id", "w.id")
    .selectAll("w")
    .where("w.difficulty", "in", difficulties)
    .where("s.dislikes", "=", 0)
    .where("w.definition", "is not", null)
    .where("w.definition", "!=", "")
    .where("s.dislikes", "=", 0);

  if (lang) q = q.where("w.lang_code", "=", lang);
  if (pos) q = q.where("w.pos", "=", pos);

  return await q.orderBy(sql`random()`).limit(limit).execute();
}
