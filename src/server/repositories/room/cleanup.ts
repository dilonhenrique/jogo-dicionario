"use server";

import db from "@/infra/db";

export default async function cleanup() {
  await db
    .deleteFrom("rooms")
    .where("expires_at", "<", new Date())
    .execute();
}
