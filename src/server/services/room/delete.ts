"use server";

import { roomRepo } from "@/server/repositories/room";

export default async function deleteRoom(code: string) {
  return await roomRepo.delete(code);
}
