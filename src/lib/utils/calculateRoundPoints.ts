import { WordRound } from "@/types/game";

/**
 * Calcula os pontos ganhos na rodada atual baseado nos votos.
 * Não faz requisições - usa apenas dados já disponíveis no contexto.
 * 
 * Regras:
 * - Votou na palavra verdadeira: +1 ponto para o votante
 * - Votou em definição falsa: +1 ponto para o autor da definição falsa
 */
export function calculateRoundPoints(
  votes: Map<string, string>,
  currentRound: WordRound | null
): Map<string, number> {
  const pointsMap = new Map<string, number>();
  
  if (!currentRound) {
    return pointsMap;
  }

  const realWordId = currentRound.word.id;

  for (const [userId, votedDefinitionId] of votes.entries()) {
    // Votou na palavra verdadeira
    if (votedDefinitionId === realWordId) {
      const current = pointsMap.get(userId) || 0;
      pointsMap.set(userId, current + 1);
      continue;
    }

    // Votou em definição falsa - ponto para o autor
    const fakeDefinition = currentRound.fakes.find(f => f.id === votedDefinitionId);
    if (fakeDefinition) {
      const authorId = fakeDefinition.author.id;
      const current = pointsMap.get(authorId) || 0;
      pointsMap.set(authorId, current + 1);
    }
  }

  return pointsMap;
}
