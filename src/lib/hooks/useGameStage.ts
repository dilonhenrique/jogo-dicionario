import { GameStage } from "@/types/game";
import { useState } from "react";

const stageOrder: GameStage[] = ["setup", "word_pick", "definition", "guess", "result", "finishing"];

const stageValidation: Record<GameStage, () => boolean> = {
  setup: () => true,
  word_pick: () => true,
  definition: () => true,
  guess: () => true,
  result: () => true,
  finishing: () => true,
}

export function useGameStage() {
  const [currentStage, setStage] = useState<GameStage>("setup");

  function goToNextStage() {
    const index = stageOrder.findIndex(s => s === currentStage);

    if (index < 0) return;

    if (index === (stageOrder.length - 1)) {
      reset();
    } else {
      setStage(stageOrder[index + 1]);
    }
  }

  function reset() {
    setStage(stageOrder[0]);
  }

  function getValidator(stage: GameStage = currentStage) {
    return stageValidation[stage];
  }

  return {
    stage: currentStage,
    setStage,
    goToNextStage,
    reset,
    getValidator,
  };
}