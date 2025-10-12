"use server";

import db from "@/infra/db";
import { WordRound } from "@/types/game";

export async function getCurrentRound(roomCode: string): Promise<WordRound | null> {
  // Busca a rodada atual com todas as definições falsas e autores em UMA query com JOIN
  const result = await db
    .selectFrom('game_sessions as gs')
    .innerJoin('game_rounds as gr', 'gr.id', 'gs.current_round_id')
    .leftJoin('game_fake_definitions as gfd', 'gfd.round_id', 'gr.id')
    .leftJoin('game_players as gp', (join) =>
      join
        .onRef('gp.user_id', '=', 'gfd.author_user_id')
        .on('gp.room_code', '=', roomCode)
    )
    .where('gs.room_code', '=', roomCode)
    .select([
      'gr.id as round_id',
      'gr.word_id',
      'gr.word_label',
      'gr.word_definition',
      'gfd.id as fake_id',
      'gfd.definition as fake_definition',
      'gfd.author_user_id',
      'gp.user_name as author_name',
    ])
    .execute();

  if (result.length === 0) {
    return null;
  }

  // Agrupa os resultados (pode vir múltiplas linhas por causa do LEFT JOIN)
  const firstRow = result[0];
  const fakes = result
    .filter(row => row.fake_id !== null)
    .map(row => ({
      id: row.fake_id!,
      definition: row.fake_definition!,
      author: {
        id: row.author_user_id!,
        name: row.author_name || "Unknown",
      },
    }));

  // Remove duplicatas (caso hajam)
  const uniqueFakes = Array.from(
    new Map(fakes.map(f => [f.id, f])).values()
  );

  return {
    id: firstRow.round_id ?? '',
    word: {
      id: firstRow.word_id ?? '',
      label: firstRow.word_label,
      definition: firstRow.word_definition,
    },
    fakes: uniqueFakes,
  };
}
