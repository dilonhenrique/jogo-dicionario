"use server";

import db from "@/infra/db";

/**
 * Busca apenas a sessão (sem rodada) - mais rápido quando só precisamos do stage
 */
export default async function getSimple(roomCode: string) {
  return await db
    .selectFrom('game_sessions')
    .where('room_code', '=', roomCode)
    .selectAll()
    .executeTakeFirst();
}
