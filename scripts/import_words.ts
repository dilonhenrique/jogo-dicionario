import "dotenv/config";
import db from "@/infra/db";
import { createReadStream } from "node:fs";
import { Transform } from "node:stream";
import { parse } from "csv-parse";
import { CsvRow as CsvRowSchema } from "@/lib/utils/schemas/wordImport";

function cleanChunk(s: string) {
  return s
    .replace(/\uFEFF/g, "")
    .replace(/[\u200B-\u200D\u2060]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/"\s+(?=,|\n|$)/g, '"');
}

const sanitizer = new Transform({
  transform(chunk, _enc, cb) {
    cb(null, cleanChunk(chunk.toString("utf8")));
  },
});

function parseGlossesField(raw: string | undefined): unknown[] {
  const s = (raw ?? "").trim();
  if (!s) return [];
  if (s.startsWith("[")) {
    try { return JSON.parse(s); } catch { }
  }
  if (s.startsWith("{") && s.endsWith("}")) {
    const vals = Array.from(s.matchAll(/"([^"]+)"/g)).map(m => m[1]).filter(Boolean);
    return vals.length ? vals : [];
  }
  const sep = s.includes(";") ? ";" : s.includes("|") ? "|" : s.includes(",") ? "," : null;
  if (sep) {
    return s.split(sep).map(t => t.trim()).filter(Boolean);
  }
  return [s];
}

function normalizeZipfToString(zipf: string): string {
  const n = Number(zipf.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) throw new Error(`zipf inválido: ${zipf}`);
  // opcional: fixa 3 casas
  return n.toFixed(3);
}

async function importCsv(path: string) {
  const stream = createReadStream(path, { encoding: "utf8" })
    .pipe(sanitizer)
    .pipe(parse({
      columns: ['word', 'lemma', 'zipf', 'difficulty', 'lang_code', 'pos', 'definition', 'glosses_json'],
      from_line: 2,
      bom: true,
      trim: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      skip_records_with_error: false,
      quote: '"',
      escape: '"',
      record_delimiter: "auto",
    }));

  let line = 1;

  for await (const rec of stream) {
    line++;

    const parsed = CsvRowSchema.safeParse(rec);
    if (!parsed.success) {
      console.warn(
        `Linha ignorada ${line}:`,
        parsed.error.issues.map(i => i.message).join("; ")
      );
      continue;
    }

    try {
      const r = parsed.data;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const glossesArr = parseGlossesField(r.glosses_json) as any;
      const zipfStr = normalizeZipfToString(r.zipf);

      await db
        .insertInto("words")
        .values({
          word: r.word,
          lemma: r.lemma,
          zipf: zipfStr,
          difficulty: r.difficulty,
          lang_code: r.lang_code,
          pos: r.pos,
          definition: r.definition,
          glosses: glossesArr,
          source: "wiktionary",
        })
        .onConflict(oc => oc
          .columns(["lang_code", "word"])
          .doUpdateSet({
            lemma: r.lemma,
            zipf: zipfStr,
            difficulty: r.difficulty,
            pos: r.pos,
            definition: r.definition,
            glosses: glossesArr,
          })
        )
        .execute();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(`Falha ao importar linha ${line}:`, e?.message ?? e);
      continue;
    }
  }

  console.log("Import finalizado ✅");
}

importCsv("../palavras/verbos_limpos.csv").catch((e) => {
  console.error(e);
  process.exit(1);
});
