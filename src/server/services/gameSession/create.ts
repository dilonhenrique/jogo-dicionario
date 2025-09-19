"use server";

import { gameSessionRepo } from "@/server/repositories/gameSession";

export default async function create(props: Parameters<typeof gameSessionRepo.create>[0]) {
  return await gameSessionRepo.create(props);
}
