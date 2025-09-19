"use server";

import { roomRepo } from "@/server/repositories/room";

export default async function isHost(code: string, userId: string) {
  return await roomRepo.isHost(code, userId);
}
