"use server";

import db from "@/infra/db";

export default async function extend(code: string, additionalHours: number = 4) {
  await db
    .updateTable("rooms")
    .set({
      expires_at: new Date(Date.now() + additionalHours * 60 * 60 * 1000),
    })
    .where("code", "=", code)
    .execute();
}
