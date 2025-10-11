"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import type { GameStage } from "@/types/game";

export async function changeStage(roomCode: string, stage: GameStage) {
  await gameSessionRepo.updateStage(roomCode, stage);
  return { success: true, stage };
}
