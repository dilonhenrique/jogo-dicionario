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

  function startNextRound(round: WordRound) {
    setCurrentRound(current => {
      if (current) {
        console.error("Can't start a new round while current still active.");
        return current;
      }

      return round;
    });
  }

  return {
    currentRound,
    roundHistory,
    startNextRound,
    checkoutCurrentRound,
  };
}