"use server";

import { roomRepo } from "@/server/repositories/room";

export default async function cleanup() {
  return await roomRepo.cleanup();
}
