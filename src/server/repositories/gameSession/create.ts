"use server";

import db from "@/infra/db";
import { GameState } from "@/types/game";

type Props = {
  roomCode: string;
  initialState: GameState;
}

export default async function create({ roomCode, initialState }: Props) {
  await db
    .insertInto("game_sessions")
    .values({
      room_code: roomCode,
      game_state: initialState,
    })
    .execute();
}
