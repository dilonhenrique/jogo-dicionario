"use server";

import { gamePlayerRepo } from "@/server/repositories/gamePlayer";
import { GamePlayer } from "@/types/user";

export async function getPlayers(roomCode: string): Promise<GamePlayer[]> {
  const playersData = await gamePlayerRepo.get(roomCode);
  
  return playersData.map(p => ({
    id: p.user_id,
    name: p.user_name,
    points: p.points,
    isHost: false, // Será definido no contexto de Room
    onlineAt: null, // Será preenchido no contexto de Room
  }));
}
