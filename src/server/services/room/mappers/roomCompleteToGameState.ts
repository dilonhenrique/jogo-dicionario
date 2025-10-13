import { RoomComplete } from "@/infra/db/types";
import { GameState, WordRound } from "@/types/game";

export function roomCompleteToGameState(room: RoomComplete): GameState | undefined {
  if (!room.game_session) {
    return undefined;
  }

  const votesMap = new Map<string, string>();
  const wordId = room.current_round?.word_id ?? '';

  room.game_votes?.forEach(vote => {
    votesMap.set(vote.user_id, vote.is_real_word ? wordId : (vote.definition_id || ''));
  });

  const currentRound: WordRound | null = room.current_round ? {
    id: room.current_round.id,
    word: {
      id: room.current_round.word_id || '',
      label: room.current_round.word_label,
      definition: room.current_round.word_definition,
    },
    fakes: room.game_fake_definitions?.map(fake => ({
      id: fake.id,
      definition: fake.definition,
      author: {
        id: fake.author_user_id,
        name: room.game_players?.find(p => p.user_id === fake.author_user_id)?.user_name || '',
      },
    })) || [],
  } : null;

  const players = room.game_players?.map(player => ({
    id: player.user_id,
    name: player.user_name,
    points: player.points,
    onlineAt: null, // Será preenchido pelo contexto com presence
    isHost: player.user_id === room.host_user_id,
  })) || [];

  return {
    stage: room.game_session.stage,
    currentRound,
    roundHistory: [], // TODO: buscar do banco se necessário
    players,
    votes: Array.from(votesMap.entries()),
  };
}
