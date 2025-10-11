"use server";

import db from "@/infra/db";

/**
 * Busca a sessão com a rodada atual completa (incluindo fakes e votos)
 */
export default async function getWithCurrentRound(roomCode: string) {
  const result = await db
    .selectFrom('game_sessions as gs')
    .leftJoin('game_rounds as gr', 'gs.current_round_id', 'gr.id')
    .leftJoin('game_fake_definitions as gfd', 'gr.id', 'gfd.round_id')
    .leftJoin('game_votes as gv', 'gr.id', 'gv.round_id')
    .where('gs.room_code', '=', roomCode)
    .select([
      // Session fields
      'gs.room_code',
      'gs.stage',
      'gs.current_round_id',
      'gs.created_at as session_created_at',
      
      // Round fields
      'gr.id as round_id',
      'gr.round_number',
      'gr.word_id',
      'gr.word_label',
      'gr.word_definition',
      'gr.started_at as round_started_at',
      'gr.finished_at as round_finished_at',
      
      // Fake definition fields
      'gfd.id as fake_id',
      'gfd.author_user_id as fake_author_id',
      'gfd.definition as fake_definition',
      'gfd.created_at as fake_created_at',
      
      // Vote fields
      'gv.user_id as vote_user_id',
      'gv.definition_id as vote_definition_id',
      'gv.is_real_word as vote_is_real_word',
      'gv.voted_at',
    ])
    .execute();

  if (!result.length) {
    return null;
  }

  // Agrupar resultado (como temos LEFT JOINs, pode haver múltiplas linhas)
  const firstRow = result[0];
  
  const session = {
    room_code: firstRow.room_code,
    stage: firstRow.stage,
    current_round_id: firstRow.current_round_id,
    created_at: firstRow.session_created_at,
  };

  // Se não houver rodada atual, retornar só a session
  if (!firstRow.round_id) {
    return {
      session,
      currentRound: null,
    };
  }

  const currentRound = {
    id: firstRow.round_id!,
    room_code: roomCode,
    round_number: firstRow.round_number!,
    word_id: firstRow.word_id!,
    word_label: firstRow.word_label!,
    word_definition: firstRow.word_definition!,
    started_at: firstRow.round_started_at!,
    finished_at: firstRow.round_finished_at,
  };

  // Agrupar fakes (remover duplicatas)
  const fakesMap = new Map();
  const votesMap = new Map();

  for (const row of result) {
    if (row.fake_id && !fakesMap.has(row.fake_id)) {
      fakesMap.set(row.fake_id, {
        id: row.fake_id,
        round_id: row.round_id!,
        author_user_id: row.fake_author_id!,
        definition: row.fake_definition!,
        created_at: row.fake_created_at!,
      });
    }

    if (row.vote_user_id && !votesMap.has(row.vote_user_id)) {
      votesMap.set(row.vote_user_id, {
        round_id: row.round_id!,
        user_id: row.vote_user_id,
        definition_id: row.vote_definition_id,
        is_real_word: row.vote_is_real_word!,
        voted_at: row.voted_at!,
      });
    }
  }

  return {
    session,
    currentRound,
    fakes: Array.from(fakesMap.values()),
    votes: Array.from(votesMap.values()),
  };
}
