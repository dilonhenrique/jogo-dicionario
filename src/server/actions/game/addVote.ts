"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import { gameVoteRepo } from "@/server/repositories/gameVote";
import { gamePlayerRepo } from "@/server/repositories/gamePlayer";

export async function addVote({
  roomCode,
  userId,
  definitionId,
  isRealWord,
}: {
  roomCode: string;
  userId: string;
  definitionId: string | null;
  isRealWord: boolean;
}) {
  const currentRoundId = await gameSessionRepo.getCurrentRoundId(roomCode);

  if (!currentRoundId) {
    throw new Error('Nenhuma rodada ativa');
  }

  await gameVoteRepo.create({
    round_id: currentRoundId,
    user_id: userId,
    room_code: roomCode,
    definition_id: definitionId,
    is_real_word: isRealWord,
  });

  const [players, votes] = await Promise.all([
    gamePlayerRepo.get(roomCode),
    gameVoteRepo.getByRound(currentRoundId),
  ]);

  if (players.length > 0 && players.length === votes.length) {
    await gameSessionRepo.updateStage(roomCode, 'blame');
  }

  return { success: true };
}
