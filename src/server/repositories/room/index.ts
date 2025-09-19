import create from "./create";
import get from "./get";
import transfer from "./transfer";
import extend from "./extend";
import isHost from "./isHost";
import getByHost from "./getByHost";
import deleteRoom from "./delete";
import cleanup from "./cleanup";

export const roomRepo = { 
  create, 
  get, 
  transfer, 
  extend, 
  isHost, 
  getByHost, 
  delete: deleteRoom, 
  cleanup 
};