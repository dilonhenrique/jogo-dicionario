"use server";

import db from "@/infra/db";
import { RoomComplete } from "@/infra/db/types";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

export default async function get(code: string): Promise<RoomComplete | undefined> {
  const result = await db
    .selectFrom("rooms")
    .leftJoin("game_sessions", "game_sessions.room_code", "rooms.code")
    .select([
      "rooms.code",
      "rooms.host_user_id",
      "rooms.host_user_name",
      "rooms.configs",
      "rooms.expires_at",
      "rooms.created_at",
      // Game session como objeto
      (eb) => jsonObjectFrom(
        eb.selectFrom("game_sessions")
          .selectAll()
          .whereRef("game_sessions.room_code", "=", "rooms.code")
      ).as("game_session"),
      // Players do jogo como array
      (eb) => jsonArrayFrom(
        eb.selectFrom("game_players")
          .selectAll()
          .whereRef("game_players.room_code", "=", "rooms.code")
          .where("kicked_at", "is", null)
      ).as("game_players"),
      // Round atual como objeto
      (eb) => jsonObjectFrom(
        eb.selectFrom("game_rounds")
          .selectAll()
          .whereRef("game_rounds.id", "=", "game_sessions.current_round_id")
      ).as("current_round"),
      // Votos como array
      (eb) => jsonArrayFrom(
        eb.selectFrom("game_votes")
          .selectAll()
          .whereRef("game_votes.round_id", "=", "game_sessions.current_round_id")
      ).as("game_votes"),
      // Definições falsas como array
      (eb) => jsonArrayFrom(
        eb.selectFrom("game_fake_definitions")
          .selectAll()
          .whereRef("game_fake_definitions.round_id", "=", "game_sessions.current_round_id")
      ).as("game_fake_definitions"),
    ])
    .where("rooms.code", "=", code)
    .where("rooms.expires_at", ">", new Date())
    .executeTakeFirst();

  return result as RoomComplete | undefined;
}
