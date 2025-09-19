"use server";

import db from "@/infra/db";

export default async function isHost(code: string, userId: string): Promise<boolean> {
  const room = await db
    .selectFrom("rooms")
    .select("host_user_id")
    .where("code", "=", code)
    .where("expires_at", ">", new Date())
    .executeTakeFirst();

  return room?.host_user_id === userId;
}
