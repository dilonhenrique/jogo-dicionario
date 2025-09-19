import create from "./create";
import get from "./get";
import updateState from "./updateState";
import updateConfigs from "./updateConfigs";
import deleteGameSession from "./delete";

export const gameSessionRepo = { 
  create, 
  get, 
  updateState, 
  updateConfigs, 
  delete: deleteGameSession 
};