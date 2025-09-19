"use server";

import { roomRepo } from "@/server/repositories/room";

export default async function create(props: Parameters<typeof roomRepo.create>[0]) {
  return await roomRepo.create(props);
}
