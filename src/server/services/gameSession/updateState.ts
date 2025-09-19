"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import { roomRepo } from "@/server/repositories/room";
import { GameState } from "@/types/game";

export default async function updateState(roomCode: string, state: GameState) {
  await gameSessionRepo.updateState(roomCode, state);
  await roomRepo.extend(roomCode);
}
