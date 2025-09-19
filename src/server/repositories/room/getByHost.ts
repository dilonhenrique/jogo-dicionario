"use server";

import db from "@/infra/db";
import { Room } from "@/infra/db/types";

export default async function getByHost(hostUserId: string): Promise<Room[]> {
  return await db
    .selectFrom("rooms")
    .selectAll()
    .where("host_user_id", "=", hostUserId)
    .where("expires_at", ">", new Date())
    .orderBy("created_at", "desc")
    .execute();
}
