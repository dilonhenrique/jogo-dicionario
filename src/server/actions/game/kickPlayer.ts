"use server";

import { gamePlayerRepo } from "@/server/repositories/gamePlayer";

export async function kickPlayer({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  await gamePlayerRepo.kick(roomCode, userId);
  return { success: true };
}
