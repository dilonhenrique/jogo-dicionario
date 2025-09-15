import { z } from 'zod';

const Difficulty = z.enum(["insane", "very-hard", "hard", "medium-hard", "medium", "easy"]);
const Pos = z.enum(["noun", "verb", "adj", "adv", "pron", "prep", "conj", "interj", "num", "det", "abbr", "prefix", "suffix", "other"]);

export const CsvRow = z.object({
  word: z.string(),
  lemma: z.string(),
  zipf: z.string().or(z.number()).transform(v => String(v)),
  difficulty: Difficulty,
  lang_code: z.string().min(2).max(5),
  pos: Pos,
  definition: z.string(),
  glosses_json: z.string().optional().default(""),
}).strict();
