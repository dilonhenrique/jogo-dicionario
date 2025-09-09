import { WordRound } from "@/types/game";
import { useState } from "react";

export function useGameRound() {
  const [currentRound, setCurrentRound] = useState<WordRound | null>(null);
  const [roundHistory, setRoundHistory] = useState<WordRound[]>([]);

  function checkoutCurrentRound() {
    setCurrentRound(current => {
      if (current) {
        setRoundHistory(history => ([...history, current]));
      }

      return null;
    })
  }

  return {
    currentRound,
    roundHistory,
    checkoutCurrentRound,
  };
}