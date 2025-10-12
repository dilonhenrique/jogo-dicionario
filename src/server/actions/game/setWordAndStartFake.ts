"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import { gameRoundRepo } from "@/server/repositories/gameRound";
import type { SimpleWord } from "@/types/game";
import { v4 } from "uuid";

export async function setWordAndStartFake({
  roomCode,
  word,
}: {
  roomCode: string;
  word: SimpleWord;
}) {
  const nextRoundNumber = await gameRoundRepo.getNextRoundNumber(roomCode);

  const newRound = await gameRoundRepo.create({
    id: v4(),
    room_code: roomCode,
    round_number: nextRoundNumber,
    word_id: v4(), // ID temporário para palavra não do banco
    word_label: word.label,
    word_definition: word.definition,
  });

  if (!newRound) {
    throw new Error('Erro ao criar rodada');
  }

  await gameSessionRepo.updateStageAndRound(roomCode, 'fake', newRound.id);

  return { success: true, round: newRound };
}
