"use server";

import { roomRepo } from "@/server/repositories/room";

export default async function transfer(props: Parameters<typeof roomRepo.transfer>[0]) {
  return await roomRepo.transfer(props);
}
