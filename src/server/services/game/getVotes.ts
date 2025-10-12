"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import { gameVoteRepo } from "@/server/repositories/gameVote";
import { gameRoundRepo } from "@/server/repositories/gameRound";

export async function getVotes(roomCode: string): Promise<Map<string, string>> {
  const session = await gameSessionRepo.getSimple(roomCode);
  
  if (!session?.current_round_id) {
    return new Map();
  }

  const round = await gameRoundRepo.getCurrent(roomCode);
  if (!round) {
    return new Map();
  }

  const votes = await gameVoteRepo.getByRound(session.current_round_id);
  
  const votesMap = new Map<string, string>();
  votes.forEach(v => {
    votesMap.set(v.user_id, v.definition_id || round.word_id);
  });

  return votesMap;
}
