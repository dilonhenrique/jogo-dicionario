"use server";

import db from "@/infra/db";
import { GameConfig, GameState } from "@/types/game";

type Props = {
  roomCode: string;
  configs: GameConfig;
  initialState: GameState;
}

export default async function create({ roomCode, configs, initialState }: Props) {
  await db
    .insertInto("game_sessions")
    .values({
      room_code: roomCode,
      configs,
      game_state: initialState,
    })
    .execute();
}
