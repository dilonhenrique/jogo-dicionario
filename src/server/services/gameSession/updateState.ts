"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import { GameState } from "@/types/game";

export default async function updateState(roomCode: string, state: GameState) {
  return await gameSessionRepo.updateState(roomCode, state);
}
