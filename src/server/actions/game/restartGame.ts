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
  // 1. Resetar pontos dos jogadores
  await gamePlayerRepo.reset(roomCode);

  // 2. Finalizar todas as rodadas abertas
  const openRounds = await gameRoundRepo.getOpenRounds(roomCode);
  
  for (const round of openRounds) {
    await gameRoundRepo.finish(round.id);
  }

  // 3. Iniciar nova rodada
  if (configs.enableHostChooseWord) {
    // Host deve escolher palavra
    await gameSessionRepo.updateStageAndRound(roomCode, 'word_pick', null);
  } else {
    // Escolher palavra aleatória e começar
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
