"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import { gameFakeDefinitionRepo } from "@/server/repositories/gameFakeDefinition";

export async function removeFakeDefinition({
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

  // 2. Remover definição falsa
  await gameFakeDefinitionRepo.remove(currentRoundId, userId);

  return { success: true };
}
