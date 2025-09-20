"use server";

import db from "@/infra/db";
import { GameConfig } from "@/types/game";
import { DEFAULT_CONFIG } from "@/lib/consts/defaultConfig";
import { Room } from "@/infra/db/types";

type Props = {
  code: string;
  host: {
    id: string;
    name: string;
  };
  configs?: GameConfig;
}

export default async function createRoom({ code, host, configs = DEFAULT_CONFIG }: Props): Promise<Room | null> {
  const existingRoom = await db
    .selectFrom("rooms")
    .select("expires_at")
    .where("code", "=", code)
    .executeTakeFirst();

  if (existingRoom && existingRoom.expires_at > new Date()) {
    return null;
  }

  const [response] = await db
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
      .where("expires_at", "<", new Date())
      .doUpdateSet({
        host_user_id: host.id,
        host_user_name: host.name,
        configs,
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000),
      })
    )
    .returning([
      "code",
      "host_user_id",
      "host_user_name",
      "configs",
      "created_at",
      "expires_at"
    ])
    .execute();

  return response;
}