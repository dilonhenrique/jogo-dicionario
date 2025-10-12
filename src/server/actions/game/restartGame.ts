"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import { gamePlayerRepo } from "@/server/repositories/gamePlayer";
import { gameRoundRepo } from "@/server/repositories/gameRound";
import { dictionaryService } from "@/server/services/dictionary";
import type { GameConfig } from "@/types/game";
import { v4 } from "uuid";

export async function restartGame({
  roomCode,
  configs,
}: {
  roomCode: string;
  configs: GameConfig;
}) {
  const [, openRounds] = await Promise.all([
    gamePlayerRepo.reset(roomCode),
    gameRoundRepo.getOpenRounds(roomCode),
  ]);

  await Promise.all(
    openRounds.map(round => gameRoundRepo.finish(round.id))
  );

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

  return { success: true };
}
