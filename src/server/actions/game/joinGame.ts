"use server";

import { gamePlayerRepo } from "@/server/repositories/gamePlayer";

export async function joinGame({
  roomCode,
  userId,
  userName,
}: {
  roomCode: string;
  userId: string;
  userName: string;
}) {
  const existingPlayers = await gamePlayerRepo.get(roomCode);
  const playerExists = existingPlayers.some(p => p.user_id === userId);

  if (playerExists) {
    return { success: true, alreadyJoined: true };
  }

  await gamePlayerRepo.create({
    room_code: roomCode,
    user_id: userId,
    user_name: userName,
    points: 0,
  });

  return { success: true, alreadyJoined: false };
}
