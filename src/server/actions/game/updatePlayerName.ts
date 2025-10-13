"use server";

import { gamePlayerRepo } from "@/server/repositories/gamePlayer";

type UpdatePlayerNameParams = {
  roomCode: string;
  userId: string;
  newName: string;
}

export async function updatePlayerName(input: UpdatePlayerNameParams) {
  await gamePlayerRepo.updateName(input);

  return { success: true, alreadyJoined: false };
}
