import { sample, times, isString } from "lodash";

const CODE_LENGTH = 8;
const ALPHANUM = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function generateRoomCode(): string {
  return times(CODE_LENGTH, () => sample(ALPHANUM)).join("");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isValidRoomCode(code: any): code is string {
  return isString(code) && /^[0-9A-Za-z]{8}$/.test(code);
}
