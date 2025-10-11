import create from "./create";
import get from "./get";
import getSimple from "./getSimple";
import updateState from "./updateState";
import deleteGameSession from "./delete";
import updateStage from "./updateStage";
import updateCurrentRound from "./updateCurrentRound";
import updateStageAndRound from "./updateStageAndRound";
import getCurrentRoundId from "./getCurrentRoundId";
import getWithCurrentRound from "./getWithCurrentRound";

export const gameSessionRepo = { 
  create, 
  get,
  getSimple,
  getWithCurrentRound,
  updateState,
  updateStage,
  updateCurrentRound,
  updateStageAndRound,
  getCurrentRoundId,
  delete: deleteGameSession 
};