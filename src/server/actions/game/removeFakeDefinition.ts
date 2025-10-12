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
  const currentRoundId = await gameSessionRepo.getCurrentRoundId(roomCode);

  if (!currentRoundId) {
    throw new Error('Nenhuma rodada ativa');
  }

  await gameFakeDefinitionRepo.remove(currentRoundId, userId);

  return { success: true };
}
