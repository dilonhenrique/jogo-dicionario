import "dotenv/config";
import { createReadStream } from "node:fs";
import { Transform } from "node:stream";
import { parse } from "csv-parse";
import db from "@/infra/db";
import { CsvRow as CsvRowSchema } from "@/lib/utils/schemas/wordImport";

function cleanChunk(s: string) {
  return s
    .replace(/\uFEFF/g, "")            // BOM
    .replace(/[\u200B-\u200D\u2060]/g, "") // zero-width chars
    .replace(/\u00A0/g, " ")           // NBSP -> espaço
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // remove espaços após aspas finais ANTES de vírgula ou fim de linha
    .replace(/"\s+(?=,|\n|$)/g, '"');
}

const sanitizer = new Transform({
  transform(chunk, _enc, cb) {
    cb(null, cleanChunk(chunk.toString("utf8")));
  },
});

/** Converte o campo solto `glosses_json` em array JSON */
function parseGlossesField(raw: string | undefined): unknown[] {
  const s = (raw ?? "").trim();
  if (!s) return [];
  // casos ideais: já é JSON array
  if (s.startsWith("[")) {
    try { return JSON.parse(s); } catch { }
  }
  // casos ruins: veio com chaves { "x" } => vira ["x"]
  if (s.startsWith("{") && s.endsWith("}")) {
    // extrai valores entre aspas e vira array
    const vals = Array.from(s.matchAll(/"([^"]+)"/g)).map(m => m[1]).filter(Boolean);
    return vals.length ? vals : [];
  }
  // casos: CSV de uma string única (sem colchetes) -> vira ["..."]
  // ou lista separada por ; | , -> split
  const sep = s.includes(";") ? ";" : s.includes("|") ? "|" : s.includes(",") ? "," : null;
  if (sep) {
    return s.split(sep).map(t => t.trim()).filter(Boolean);
  }
  return [s];
}

/** Normaliza zipf vindo como string/num, aceita vírgula decimal. Retorna string (Numeric=string) */
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
      // DEFINA as colunas fixas e pule o header
      columns: ['word', 'lemma', 'zipf', 'difficulty', 'lang_code', 'pos', 'definition', 'glosses_json'],
      from_line: 2,              // pula a linha 1 (cabeçalho)
      bom: true,
      trim: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      skip_records_with_error: false, // mantém erro pra logar; mude pra true se quiser só ignorar
      quote: '"',
      escape: '"',
      record_delimiter: "auto",
    }));

  let line = 1; // contando depois do header

  for await (const rec of stream) {
    line++;
    // valida campos “brutos”
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

      // IMPORTANTE:
      // - Se no seu Database types (Kysely) 'zipf' for number, troque para Number(zipfStr)
      // - Se 'glosses' for string[], mapeie .map(String)
      await db
        .insertInto("words")
        .values({
          word: r.word,
          lemma: r.lemma,
          zipf: zipfStr,                 // manter como string se Numeric=string
          difficulty: r.difficulty,
          lang_code: r.lang_code,
          pos: r.pos,
          definition: r.definition,
          glosses: glossesArr,           // array JSON válido
          source: "wiktionary",
        }) // <- se seu tipo pedir ColumnType, pode ser necessário o 'as any' aqui no script de ETL apenas
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
      // segue o baile (não derruba todo o import)
      continue;
    }
  }

  console.log("Import finalizado ✅");
}

importCsv("../palavras/verbos_limpos.csv").catch((e) => {
  console.error(e);
  process.exit(1);
});
