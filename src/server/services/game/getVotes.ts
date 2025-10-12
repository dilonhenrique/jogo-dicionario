"use server";

import db from "@/infra/db";

export async function getVotes(roomCode: string): Promise<Map<string, string>> {
  // Busca votos + round em UMA query com JOIN
  const result = await db
    .selectFrom('game_sessions as gs')
    .innerJoin('game_rounds as gr', 'gr.id', 'gs.current_round_id')
    .leftJoin('game_votes as gv', (join) =>
      join
        .onRef('gv.round_id', '=', 'gr.id')
        .on('gv.room_code', '=', roomCode)
    )
    .where('gs.room_code', '=', roomCode)
    .select([
      'gr.word_id',
      'gv.user_id',
      'gv.definition_id',
    ])
    .execute();

  if (result.length === 0) {
    return new Map();
  }

  const votesMap = new Map<string, string>();
  const wordId = result[0].word_id ?? '';

  result.forEach(row => {
    if (row.user_id) {
      votesMap.set(row.user_id, row.definition_id || wordId);
    }
  });

  return votesMap;
}
