"use server";

import db from "@/infra/db";

type Props = {
  code: string;
  host: {
    id: string;
    name: string;
  };
}

export default async function createRoom({ code, host }: Props) {
  // TODO: sobrepor somente se expirado
  await db
    .insertInto("rooms")
    .values({
      code,
      host_user_id: host.id,
      host_user_name: host.name,
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4h
    })
    .onConflict(oc => oc
      .column("code")
      .doUpdateSet({
        host_user_id: host.id,
        host_user_name: host.name,
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000),
      })
    )
    .execute();
}