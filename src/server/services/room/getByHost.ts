"use server";

import { roomRepo } from "@/server/repositories/room";

export default async function getByHost(hostUserId: string) {
  return await roomRepo.getByHost(hostUserId);
}
