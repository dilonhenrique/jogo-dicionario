"use server";

import { gameFakeDefinitionRepo } from "@/server/repositories/gameFakeDefinition";

export async function removeFakeDefinition({
  currentRoundId,
  userId,
}: {
  currentRoundId: string;
  userId: string;
}) {
  await gameFakeDefinitionRepo.remove(currentRoundId, userId);

  return { success: true };
}
