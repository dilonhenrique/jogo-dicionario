"use server";

import db from "@/infra/db";

export default async function deleteRoom(code: string) {
  await db
    .deleteFrom("rooms")
    .where("code", "=", code)
    .execute();
}
