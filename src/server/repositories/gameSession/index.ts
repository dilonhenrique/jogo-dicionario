import create from "./create";
import get from "./get";
import updateState from "./updateState";
import deleteGameSession from "./delete";
import updateStage from "./updateStage";
import updateCurrentRound from "./updateCurrentRound";
import updateStageAndRound from "./updateStageAndRound";
import getCurrentRoundId from "./getCurrentRoundId";

export const gameSessionRepo = { 
  create, 
  get, 
  updateState,
  updateStage,
  updateCurrentRound,
  updateStageAndRound,
  getCurrentRoundId,
  delete: deleteGameSession 
};