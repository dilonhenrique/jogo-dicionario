"use server";

import db from "@/infra/db";
import { GameConfig } from "@/types/game";
import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";

type Props = {
  code: string;
  host: {
    id: string;
    name: string;
  };
  configs?: GameConfig;
}

export default async function createRoom({ code, host, configs = DEFAULT_CONFIG }: Props) {
  await db
    .insertInto("rooms")
    .values({
      code,
      host_user_id: host.id,
      host_user_name: host.name,
      configs,
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4h
    })
    .onConflict(oc => oc
      .column("code")
      .doUpdateSet({
        host_user_id: host.id,
        host_user_name: host.name,
        configs,
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000),
      })
    )
    .execute();
}