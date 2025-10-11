"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import { gameVoteRepo } from "@/server/repositories/gameVote";

export async function removeVote({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  // 1. Buscar rodada atual
  const currentRoundId = await gameSessionRepo.getCurrentRoundId(roomCode);

  if (!currentRoundId) {
    throw new Error('Nenhuma rodada ativa');
  }

  // 2. Remover voto
  await gameVoteRepo.remove(currentRoundId, userId);

  return { success: true };
}
