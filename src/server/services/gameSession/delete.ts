"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";

export default async function deleteGameSession(roomCode: string) {
  return await gameSessionRepo.delete(roomCode);
}
