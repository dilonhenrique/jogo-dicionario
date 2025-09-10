import { GameStage } from "@/types/game";
import { useState } from "react";
import { useRoomChannel } from "../contexts/RoomContext";
import useFirstRender from "./useFirstRender";

const stageOrder: GameStage[] = ["word_pick", "definition", "guess", "result", "finishing"];

const stageValidation: Record<GameStage, () => boolean> = {
  word_pick: () => true,
  definition: () => true,
  guess: () => true,
  result: () => true,
  finishing: () => true,
}

export function useGameStage() {
  const { channel } = useRoomChannel();
  const [currentStage, setStage] = useState<GameStage>("word_pick");

  useFirstRender(() => {
    channel.on(
      "broadcast",
      { event: "stage-change" },
      ({ stage }) => {
        if (stage) setStage(stage);
      }
    )
  })

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