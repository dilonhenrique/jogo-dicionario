"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import { gameFakeDefinitionRepo } from "@/server/repositories/gameFakeDefinition";
import { gamePlayerRepo } from "@/server/repositories/gamePlayer";
import { v4 } from "uuid";

export async function addFakeDefinition({
  roomCode,
  userId,
  definition,
}: {
  roomCode: string;
  userId: string;
  definition: string;
}) {
  // 1. Buscar rodada atual
  const currentRoundId = await gameSessionRepo.getCurrentRoundId(roomCode);

  if (!currentRoundId) {
    throw new Error('Nenhuma rodada ativa');
  }

  // 2. Inserir/atualizar definição falsa
  await gameFakeDefinitionRepo.create({
    id: v4(),
    round_id: currentRoundId,
    author_user_id: userId,
    definition,
  });

  // 3. Verificar se todos enviaram
  const [players, fakes] = await Promise.all([
    gamePlayerRepo.get(roomCode),
    gameFakeDefinitionRepo.getByRound(currentRoundId),
  ]);

  // 4. Se todos enviaram, avançar para votação
  if (players.length > 0 && players.length === fakes.length) {
    await gameSessionRepo.updateStage(roomCode, 'vote');
  }

  return { success: true };
}
