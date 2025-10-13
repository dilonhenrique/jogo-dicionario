"use server";

import db from "@/infra/db";
import { GameStage } from "@/types/game";

type Props = {
  roomCode: string;
  stage: GameStage;
  players: Array<{ id: string; name: string }>;
}

export default async function create({ roomCode, stage, players }: Props) {
  // Usa transação para garantir atomicidade
  await db.transaction().execute(async (trx) => {
    // Cria a sessão de jogo
    await trx
      .insertInto("game_sessions")
      .values({
        room_code: roomCode,
        stage,
        current_round_id: null,
        game_state: {}, // deprecated
      })
      .execute();

    // Adiciona os players em batch
    if (players.length > 0) {
      await trx
        .insertInto("game_players")
        .values(
          players.map(player => ({
            room_code: roomCode,
            user_id: player.id,
            user_name: player.name,
            points: 0,
          }))
        )
        .execute();
    }
  });
}
