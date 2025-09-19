"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import { GameConfig } from "@/types/game";

export default async function updateConfigs(roomCode: string, configs: GameConfig) {
  return await gameSessionRepo.updateConfigs(roomCode, configs);
}
