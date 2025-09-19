"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";

export default async function get(roomCode: string) {
  return await gameSessionRepo.get(roomCode);
}
