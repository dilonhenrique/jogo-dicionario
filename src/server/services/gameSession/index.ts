import create from "./create";
import updateState from "./updateState";
import get from "./get";
import deleteGameSession from "./delete";

export const gameSessionService = {
  create,
  updateState,
  get,
  delete: deleteGameSession
};
