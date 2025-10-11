"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";
import { gameRoundRepo } from "@/server/repositories/gameRound";
import { gameVoteRepo } from "@/server/repositories/gameVote";
import { gamePlayerRepo } from "@/server/repositories/gamePlayer";
import { gameFakeDefinitionRepo } from "@/server/repositories/gameFakeDefinition";
import { dictionaryService } from "@/server/services/dictionary";
import type { GameConfig } from "@/types/game";
import { v4 } from "uuid";

export async function checkoutRound({
  roomCode,
  configs,
}: {
  roomCode: string;
  configs: GameConfig;
}) {
  // 1. Buscar rodada atual
  const currentRound = await gameRoundRepo.getCurrent(roomCode);
  
  if (!currentRound) {
    throw new Error('Nenhuma rodada ativa');
  }

  // 2. Calcular pontos baseado nos votos
  const [votes, fakes] = await Promise.all([
    gameVoteRepo.getByRound(currentRound.id),
    gameFakeDefinitionRepo.getByRound(currentRound.id),
  ]);

  // Contabilizar pontos (batch update)
  const pointsUpdates: Promise<unknown>[] = [];
  
  for (const vote of votes) {
    if (vote.is_real_word) {
      // Acertou a palavra real: +1 ponto
      pointsUpdates.push(
        gamePlayerRepo.incrementPoints(roomCode, vote.user_id, 1)
      );
    } else if (vote.definition_id) {
      // Votou em uma falsa: autor da falsa ganha +1 ponto
      const fake = fakes.find(f => f.id === vote.definition_id);
      if (fake) {
        pointsUpdates.push(
          gamePlayerRepo.incrementPoints(roomCode, fake.author_user_id, 1)
        );
      }
    }
  }

  // Executar todos os updates em paralelo
  await Promise.all(pointsUpdates);

  // 3. Finalizar rodada atual
  await gameRoundRepo.finish(currentRound.id);

  // 4. Verificar se alguém atingiu a pontuação máxima
  if (configs.enableMaxPoints) {
    const players = await gamePlayerRepo.get(roomCode);
    const hasWinner = players.some(p => p.points >= configs.maxPoints);
    
    if (hasWinner) {
      // Ir para tela de finalização
      await gameSessionRepo.updateStageAndRound(roomCode, 'finishing', null);
      return { success: true, finished: true };
    }
  }

  // 5. Iniciar nova rodada
  if (configs.enableHostChooseWord) {
    // Host deve escolher palavra
    await gameSessionRepo.updateStageAndRound(roomCode, 'word_pick', null);
  } else {
    // Escolher palavra aleatória e começar
    const [newWord] = await dictionaryService.getNewRandomWord();
    const nextRoundNumber = await gameRoundRepo.getNextRoundNumber(roomCode);

    const newRound = await gameRoundRepo.create({
      id: v4(),
      room_code: roomCode,
      round_number: nextRoundNumber,
      word_id: newWord.id,
      word_label: newWord.label,
      word_definition: newWord.definition,
    });

    await gameSessionRepo.updateStageAndRound(roomCode, 'fake', newRound?.id || null);
  }

  return { success: true, finished: false };
}
