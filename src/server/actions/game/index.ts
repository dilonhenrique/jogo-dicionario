export { changeStage } from "./changeStage";
export { setWordAndStartFake } from "./setWordAndStartFake";
export { addFakeDefinition } from "./addFakeDefinition";
export { removeFakeDefinition } from "./removeFakeDefinition";
export { addVote } from "./addVote";
export { removeVote } from "./removeVote";
export { checkoutRound } from "./checkoutRound";
export { restartGame } from "./restartGame";
export { kickPlayer } from "./kickPlayer";
export { joinGame } from "./joinGame";

import { changeStage } from "./changeStage";
import { setWordAndStartFake } from "./setWordAndStartFake";
import { addFakeDefinition } from "./addFakeDefinition";
import { removeFakeDefinition } from "./removeFakeDefinition";
import { addVote } from "./addVote";
import { removeVote } from "./removeVote";
import { checkoutRound } from "./checkoutRound";
import { restartGame } from "./restartGame";
import { kickPlayer } from "./kickPlayer";
import { joinGame } from "./joinGame";
import { updatePlayerName } from "./updatePlayerName";

export const gameActions = {
  changeStage,
  setWordAndStartFake,
  addFakeDefinition,
  removeFakeDefinition,
  addVote,
  removeVote,
  checkoutRound,
  restartGame,
  kickPlayer,
  joinGame,
  updatePlayerName,
};
