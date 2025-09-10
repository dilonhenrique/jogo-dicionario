import { GameStage } from "@/types/game";
import { useState } from "react";

const stageOrder: GameStage[] = ["word_pick", "fake", "vote", "blame", "finishing"];

const stageValidation: Record<GameStage, () => boolean> = {
  word_pick: () => true,
  fake: () => true,
  vote: () => true,
  blame: () => true,
  finishing: () => true,
}

export function useGameStage() {
  const [currentStage, setStage] = useState<GameStage>("word_pick");

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

  function handleSetStage(stage: GameStage) {
    let success = true;

    setStage(curr => {
      if (curr === stage) {
        success = false;
      }

      return stage;
    })

    if (!success) return null;
  }

  return {
    stage: currentStage,
    setStage: handleSetStage,
    goToNextStage,
    reset,
    getValidator,
  };
}