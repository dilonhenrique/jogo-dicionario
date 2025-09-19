"use server";

import db from "@/infra/db";

type Props = {
  code: string;
  host: {
    id: string;
    name: string;
  }
}

export default async function transfer({ code, host }: Props) {
  await db
    .updateTable("rooms")
    .set({
      host_user_id: host.id,
      host_user_name: host.name,
    })
    .where("code", "=", code)
    .execute();
}
