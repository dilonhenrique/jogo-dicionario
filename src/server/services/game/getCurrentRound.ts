"use server";

import { gameRoundRepo } from "@/server/repositories/gameRound";
import { gameFakeDefinitionRepo } from "@/server/repositories/gameFakeDefinition";
import { gamePlayerRepo } from "@/server/repositories/gamePlayer";
import { WordRound } from "@/types/game";

export async function getCurrentRound(roomCode: string): Promise<WordRound | null> {
  const round = await gameRoundRepo.getCurrent(roomCode);
  
  if (!round) {
    return null;
  }

  const [fakes, players] = await Promise.all([
    gameFakeDefinitionRepo.getByRound(round.id),
    gamePlayerRepo.get(roomCode),
  ]);

  return {
    word: {
      id: round.word_id,
      label: round.word_label,
      definition: round.word_definition,
    },
    fakes: fakes.map(f => ({
      id: f.id,
      definition: f.definition,
      author: {
        id: f.author_user_id,
        name: players.find(p => p.user_id === f.author_user_id)?.user_name || "Unknown",
      },
    })),
  };
}
