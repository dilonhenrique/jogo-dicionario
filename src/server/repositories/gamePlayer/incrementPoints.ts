import db from "@/infra/db";
import { sql } from "kysely";

export default async function incrementPoints(roomCode: string, userId: string, increment: number = 1) {
  return await db
    .updateTable('game_players')
    .set({ 
      points: sql`points + ${increment}`
    })
    .where('room_code', '=', roomCode)
    .where('user_id', '=', userId)
    .returningAll()
    .executeTakeFirst();
}
