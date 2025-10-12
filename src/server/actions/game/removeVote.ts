"use server";

import { gameVoteRepo } from "@/server/repositories/gameVote";

export async function removeVote({
  currentRoundId,
  userId,
}: {
  currentRoundId: string;
  userId: string;
}) {
  await gameVoteRepo.remove(currentRoundId, userId);

  return { success: true };
}
