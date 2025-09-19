import joinRoomChannel from "./joinRoomChannel";
import findByCode from "./findByCode";
import create from "./create";
import transfer from "./transfer";
import extend from "./extend";
import isHost from "./isHost";
import getByHost from "./getByHost";
import deleteRoom from "./delete";
import cleanup from "./cleanup";

export const roomService = {
  joinRoomChannel,
  findByCode,
  create,
  transfer,
  extend,
  isHost,
  getByHost,
  delete: deleteRoom,
  cleanup
};
