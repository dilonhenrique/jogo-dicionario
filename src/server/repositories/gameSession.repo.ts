"use server";

import db from "@/infra/db";
import { GameSession } from "@/infra/db/types";
import { GameConfig, GameState } from "@/types/game";

type CreateGameInput = {
  roomCode: string;
  configs: GameConfig;
  initialState: GameState;
}

export async function createGameSession({ roomCode, configs, initialState }: CreateGameInput) {
  await db
    .insertInto("game_sessions")
    .values({
      room_code: roomCode,
      configs,
      game_state: initialState,
    })
    .execute();
}

export async function updateGameState(roomCode: string, state: GameState) {
  await db
    .updateTable("game_sessions")
    .set({
      game_state: state,
      updated_at: new Date(),
    })
    .where("room_code", "=", roomCode)
    .execute();
}

export async function updateGameConfigs(roomCode: string, configs: GameConfig) {
  await db
    .updateTable("game_sessions")
    .set({
      configs,
      updated_at: new Date(),
    })
    .where("room_code", "=", roomCode)
    .execute();
}

export async function getGameSession(roomCode: string): Promise<GameSession | undefined> {
  return await db
    .selectFrom("game_sessions")
    .selectAll()
    .where("room_code", "=", roomCode)
    .executeTakeFirst();
}

export async function deleteGameSession(roomCode: string) {
  await db
    .deleteFrom("game_sessions")
    .where("room_code", "=", roomCode)
    .execute();
}
