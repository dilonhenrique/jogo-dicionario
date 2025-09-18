"use server";

import { pickRandomWord } from "@/server/repositories/word.repo";
import { WordDictionary } from "@/types/game";
import { capitalize } from "lodash";

export async function getNewRandomWord(quantity = 1): Promise<WordDictionary[]> {
  const random = await pickRandomWord({ difficulties: ["insane"], limit: quantity });

  return random.map(w => ({
    id: w.id,
    label: capitalize(w.word),
    definition: w.definition,
  }));
}

