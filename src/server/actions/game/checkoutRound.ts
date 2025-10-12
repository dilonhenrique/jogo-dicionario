"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import { gameRoundRepo } from "@/server/repositories/gameRound";
import { gameVoteRepo } from "@/server/repositories/gameVote";
import { gamePlayerRepo } from "@/server/repositories/gamePlayer";
import { gameFakeDefinitionRepo } from "@/server/repositories/gameFakeDefinition";
import { dictionaryService } from "@/server/services/dictionary";
import type { GameConfig } from "@/types/game";
import { v4 } from "uuid";

export async function checkoutRound({
  roomCode,
  configs,
}: {
  roomCode: string;
  configs: GameConfig;
}) {
  const currentRound = await gameRoundRepo.getCurrent(roomCode);
  
  if (!currentRound) {
    throw new Error('Nenhuma rodada ativa');
  }

  const [votes, fakes] = await Promise.all([
    gameVoteRepo.getByRound(currentRound.id),
    gameFakeDefinitionRepo.getByRound(currentRound.id),
  ]);

  const pointsUpdates: Promise<unknown>[] = [];
  
  for (const vote of votes) {
    if (vote.is_real_word) {
      pointsUpdates.push(
        gamePlayerRepo.incrementPoints(roomCode, vote.user_id, 1)
      );
    } else if (vote.definition_id) {
      const fake = fakes.find(f => f.id === vote.definition_id);
      if (fake) {
        pointsUpdates.push(
          gamePlayerRepo.incrementPoints(roomCode, fake.author_user_id, 1)
        );
      }
    }
  }

  await Promise.all(pointsUpdates);

  await gameRoundRepo.finish(currentRound.id);

  if (configs.enableMaxPoints) {
    const players = await gamePlayerRepo.get(roomCode);
    const hasWinner = players.some(p => p.points >= configs.maxPoints);
    
    if (hasWinner) {
      await gameSessionRepo.updateStageAndRound(roomCode, 'finishing', null);
      return { success: true, finished: true };
    }
  }

  if (configs.enableHostChooseWord) {
    await gameSessionRepo.updateStageAndRound(roomCode, 'word_pick', null);
  } else {
    const [newWord] = await dictionaryService.getNewRandomWord();
    const nextRoundNumber = await gameRoundRepo.getNextRoundNumber(roomCode);

    const newRound = await gameRoundRepo.create({
      id: v4(),
      room_code: roomCode,
      round_number: nextRoundNumber,
      word_id: newWord.id,
      word_label: newWord.label,
      word_definition: newWord.definition,
    });

    await gameSessionRepo.updateStageAndRound(roomCode, 'fake', newRound?.id || null);
  }

  return { success: true, finished: false };
}
