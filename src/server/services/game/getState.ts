"use server";

import { gamePlayerRepo } from "@/server/repositories/gamePlayer";
import { gameSessionRepo } from "@/server/repositories/gameSession";
import { GameStage, WordRound } from "@/types/game";
import { GamePlayer } from "@/types/user";

export type GameStateData = {
  stage: GameStage;
  players: GamePlayer[];
  currentRound: WordRound | null;
  roundHistory: WordRound[];
  votes: Map<string, string>;
};

export async function getState(roomCode: string): Promise<GameStateData | null> {
  const [sessionData, playersData] = await Promise.all([
    gameSessionRepo.getWithCurrentRound(roomCode),
    gamePlayerRepo.get(roomCode),
  ]);

  if (!sessionData) {
    return null;
  }

  const players: GamePlayer[] = playersData.map(p => ({
    id: p.user_id,
    name: p.user_name,
    points: p.points,
    isHost: false, // Será definido no contexto de Room
    onlineAt: null, // Será preenchido no contexto de Room
  }));

  let currentRound: WordRound | null = null;
  const votesMap = new Map<string, string>();

  if (sessionData.currentRound) {
    const { currentRound: round, fakes = [], votes = [] } = sessionData;

    currentRound = {
      id: round.id ?? '',
      word: {
        id: round.word_id ?? '',
        label: round.word_label,
        definition: round.word_definition,
      },
      fakes: fakes.map(f => ({
        id: f.id,
        definition: f.definition,
        author: {
          id: f.author_user_id,
          name: f.author_name, // Já vem do JOIN no repository!
        },
      })),
    };

    votes.forEach(v => {
      votesMap.set(v.user_id, v.definition_id || round.word_id || '');
    });
  }

  return {
    stage: sessionData.session.stage as GameStage,
    players,
    currentRound,
    roundHistory: [], // TODO: Implementar histórico se necessário
    votes: votesMap,
  };
}
