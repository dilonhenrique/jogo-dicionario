"use server";

import { gameFakeDefinitionRepo } from "@/server/repositories/gameFakeDefinition";
import { gamePlayerRepo } from "@/server/repositories/gamePlayer";
import { gameSessionRepo } from "@/server/repositories/gameSession";
import { v4 } from "uuid";

export async function addFakeDefinition({
  currentRoundId,
  roomCode,
  userId,
  definition,
}: {
  currentRoundId: string;
  roomCode: string;
  userId: string;
  definition: string;
}) {
  await gameFakeDefinitionRepo.create({
    id: v4(),
    round_id: currentRoundId,
    room_code: roomCode,
    author_user_id: userId,
    definition,
  });

  const [players, fakes] = await Promise.all([
    gamePlayerRepo.get(roomCode),
    gameFakeDefinitionRepo.getByRound(currentRoundId),
  ]);

  if (players.length > 0 && players.length === fakes.length) {
    await new Promise(resolve => setTimeout(resolve, 500));
    await gameSessionRepo.updateStage(roomCode, 'vote');
  }

  return { success: true };
}
