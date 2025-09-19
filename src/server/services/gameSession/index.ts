import create from "./create";
import updateState from "./updateState";
import updateConfigs from "./updateConfigs";
import get from "./get";
import deleteGameSession from "./delete";

export const gameSessionService = {
  create,
  updateState,
  updateConfigs,
  get,
  delete: deleteGameSession
};
