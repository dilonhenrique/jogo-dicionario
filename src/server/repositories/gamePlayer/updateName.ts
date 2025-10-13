import db from "@/infra/db";

type UpdateNameParams = {
  roomCode: string;
  userId: string;
  newName: string;
}

export default async function updateName({ roomCode, userId, newName }: UpdateNameParams) {
  return await db
    .updateTable('game_players')
    .set({ user_name: newName })
    .where('room_code', '=', roomCode)
    .where('user_id', '=', userId)
    .returningAll()
    .executeTakeFirst();
}
