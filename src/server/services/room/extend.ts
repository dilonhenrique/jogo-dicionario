"use server";

import { roomRepo } from "@/server/repositories/room";

export default async function extend(code: string, additionalHours?: number) {
  return await roomRepo.extend(code, additionalHours);
}
