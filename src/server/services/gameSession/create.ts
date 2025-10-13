"use server";

import { GameStage } from "@/types/game";
import { gameSessionRepo } from "@/server/repositories/gameSession";
import { dictionaryService } from "../dictionary";
import { gameActions } from "@/server/actions/game";

type Props = {
  roomCode: string;
  players: Array<{ id: string; name: string }>;
  hostChooseWord: boolean;
}

export default async function create({ roomCode, players, hostChooseWord }: Props) {
  const stage: GameStage = hostChooseWord ? 'word_pick' : 'fake';

  // Cria a sessão com os players
  await gameSessionRepo.create({
    roomCode,
    stage,
    players,
  });

  // Se não é host escolhendo palavra, já busca uma palavra aleatória e inicia o stage fake
  if (!hostChooseWord) {
    const [word] = await dictionaryService.getNewRandomWord();
    await gameActions.setWordAndStartFake({
      roomCode,
      word,
    });
  }
}
