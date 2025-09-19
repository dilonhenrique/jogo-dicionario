import create from "./create";
import get from "./get";
import updateState from "./updateState";
import deleteGameSession from "./delete";

export const gameSessionRepo = { 
  create, 
  get, 
  updateState, 
  delete: deleteGameSession 
};