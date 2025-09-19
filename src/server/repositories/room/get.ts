"use server";

import db from "@/infra/db";
import { Room } from "@/infra/db/types";

export default async function get(code: string): Promise<Room | undefined> {
  return await db
    .selectFrom("rooms")
    .selectAll()
    .where("code", "=", code)
    .where("expires_at", ">", new Date())
    .executeTakeFirst();
}
