import joinRoomChannel from "./joinRoomChannel";
import get from "./get";
import create from "./create";
import transfer from "./transfer";
import extend from "./extend";
import isHost from "./isHost";
import getByHost from "./getByHost";
import deleteRoom from "./delete";
import cleanup from "./cleanup";

export const roomService = {
  joinRoomChannel,
  get,
  create,
  transfer,
  extend,
  isHost,
  getByHost,
  delete: deleteRoom,
  cleanup
};
