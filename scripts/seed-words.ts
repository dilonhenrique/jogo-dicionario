import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import db from '@/infra/db';
import { PosTag, DifficultyLevel, NewWord } from '@/infra/db/types';
import { sql } from 'kysely';

interface WordRow {
  word: string;
  lemma: string;
  zipf: string;
  difficulty: string;
  lang_code: string;
  pos: string;
  definition: string;
  glosses: string;
}

const posMapping: Record<string, PosTag> = {
  'noun': 'noun',
  'verb': 'verb',
  'adj': 'adj',
  'adv': 'adv',
  'pron': 'pron',
  'prep': 'prep',
  'conj': 'conj',
  'interj': 'interj',
  'intj': 'intj',
  'num': 'num',
  'det': 'det',
  'abbr': 'abbr',
  'abbrev': 'abbrev',
  'prefix': 'prefix',
  'suffix': 'suffix',
  'phrase': 'phrase',
  'contraction': 'contraction',
  'name': 'name',
  'pt': 'other',
  'pos': 'other',
};

async function seedWords() {
  const csvPath = path.join(process.cwd(), 'seeds', 'words.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('Arquivo words.csv não encontrado em seeds/');
    process.exit(1);
  }

  console.log('Iniciando importação de palavras...');

  const words: Omit<NewWord, 'id' | 'created_at' | 'updated_at'>[] = [];
  let processedCount = 0;
  let skippedCount = 0;

  return new Promise<void>((resolve, reject) => {
    const parser = parse({
      columns: true,
      delimiter: ',',
      quote: '"',
      escape: '"'
    });

    parser.on('data', (row: WordRow) => {
      try {
        const mappedPos = posMapping[row.pos.toLowerCase()];
        if (!mappedPos) {
          console.warn(`POS desconhecido: ${row.pos}, usando 'other'`);
        }

        let glosses: string[] = [];
        try {
          if (row.glosses && row.glosses.trim()) {
            const parsed = JSON.parse(row.glosses);
            if (Array.isArray(parsed)) {
              glosses = parsed.filter(item => typeof item === 'string' && item.trim());
            } else if (typeof parsed === 'string') {
              glosses = [parsed.trim()];
            }
          }
        } catch {
          if (row.glosses && row.glosses.trim()) {
            const cleanGlosses = row.glosses
              .replace(/^\["|"\]$/g, '') // Remove [ e ] das bordas e aspas
              .replace(/","/g, '|||') // Substitui separadores temporariamente
              .replace(/"/g, '') // Remove aspas restantes
              .split('|||') // Divide pelos separadores
              .map(item => item.trim())
              .filter(item => item.length > 0);

            glosses = cleanGlosses.length > 0 ? cleanGlosses : [row.glosses.trim()];
          }
        }

        if (!Array.isArray(glosses) || glosses.length === 0) {
          glosses = [];
        }

        const validDifficulties: DifficultyLevel[] = ['insane', 'very-hard', 'hard', 'medium-hard', 'medium', 'easy'];
        const difficulty = validDifficulties.includes(row.difficulty as DifficultyLevel)
          ? row.difficulty as DifficultyLevel
          : 'medium';

        const word = {
          word: row.word?.trim() || '',
          lemma: row.lemma?.trim() || row.word?.trim() || '',
          zipf: String(parseFloat(row.zipf) || 0),
          difficulty,
          lang_code: row.lang_code?.trim() || 'pt',
          pos: mappedPos || 'other',
          definition: row.definition?.trim() || '',
          glosses,
          source: 'words.csv'
        };

        if (!word.word || !word.definition) {
          skippedCount++;
          return;
        }

        words.push(word);
        processedCount++;

      } catch (error) {
        console.error('Erro ao processar linha:', row, error);
        skippedCount++;
      }
    });

    parser.on('end', async () => {
      try {
        console.log(`Processando ${words.length} registros em lotes...`);
        for (let i = 0; i < words.length; i += 1000) {
          const batch = words.slice(i, i + 1000);
          await insertBatch(batch);
        }

        console.log(`\nImportação concluída:`);
        console.log(`- Palavras processadas: ${processedCount}`);
        console.log(`- Palavras ignoradas: ${skippedCount}`);

        resolve();
      } catch (error) {
        reject(error);
      }
    });

    parser.on('error', (error) => {
      console.error('Erro ao ler arquivo CSV:', error);
      reject(error);
    });

    fs.createReadStream(csvPath).pipe(parser);
  });
}

async function insertBatch(words: Omit<NewWord, 'id' | 'created_at' | 'updated_at'>[]) {
  try {
    for (const word of words) {
      const glossesJson = JSON.stringify(word.glosses);

      await db
        .insertInto('words')
        .values({
          word: word.word,
          lemma: word.lemma,
          zipf: word.zipf,
          difficulty: word.difficulty,
          lang_code: word.lang_code,
          pos: word.pos,
          definition: word.definition,
          glosses: sql`${glossesJson}::jsonb`,
          source: word.source,
        })
        .onConflict(oc => oc
          .columns(['lang_code', 'word'])
          .doUpdateSet({
            lemma: (eb) => eb.ref('excluded.lemma'),
            zipf: (eb) => eb.ref('excluded.zipf'),
            difficulty: (eb) => eb.ref('excluded.difficulty'),
            pos: (eb) => eb.ref('excluded.pos'),
            definition: (eb) => eb.ref('excluded.definition'),
            glosses: (eb) => eb.ref('excluded.glosses'),
            source: (eb) => eb.ref('excluded.source'),
            updated_at: new Date()
          })
        )
        .execute();
    }

    console.log(`Lote de ${words.length} palavras inserido`);
  } catch (error) {
    console.error('Erro ao inserir lote:', error);
    throw error;
  }
}

seedWords()
  .then(() => {
    console.log('Seed finalizado com sucesso!');
    return db.destroy();
  })
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro durante seed:', error);
    db.destroy().finally(() => process.exit(1));
  });
