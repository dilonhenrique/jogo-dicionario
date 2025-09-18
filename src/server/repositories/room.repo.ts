"use server";

import db from "@/infra/db";
import { Room } from "@/infra/db/types";

export async function createRoom(code: string, hostUserId: string, hostUserName: string) {
  // TODO: sobrepor somente se expirado
  await db
    .insertInto("rooms")
    .values({
      code,
      host_user_id: hostUserId,
      host_user_name: hostUserName,
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4h
    })
    .onConflict(oc => oc
      .column("code")
      .doUpdateSet({
        host_user_id: hostUserId,
        host_user_name: hostUserName,
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000),
      })
    )
    .execute();
}

export async function getRoom(code: string): Promise<Room | undefined> {
  return await db
    .selectFrom("rooms")
    .selectAll()
    .where("code", "=", code)
    .where("expires_at", ">", new Date())
    .executeTakeFirst();
}

export async function transferHost(code: string, newHostUserId: string, newHostUserName: string) {
  await db
    .updateTable("rooms")
    .set({
      host_user_id: newHostUserId,
      host_user_name: newHostUserName,
    })
    .where("code", "=", code)
    .execute();
}

export async function extendRoomExpiration(code: string, additionalHours: number = 4) {
  await db
    .updateTable("rooms")
    .set({
      expires_at: new Date(Date.now() + additionalHours * 60 * 60 * 1000),
    })
    .where("code", "=", code)
    .execute();
}

export async function isHostOfRoom(code: string, userId: string): Promise<boolean> {
  const room = await db
    .selectFrom("rooms")
    .select("host_user_id")
    .where("code", "=", code)
    .where("expires_at", ">", new Date())
    .executeTakeFirst();
    
  return room?.host_user_id === userId;
}

export async function getRoomsByHost(hostUserId: string): Promise<Room[]> {
  return await db
    .selectFrom("rooms")
    .selectAll()
    .where("host_user_id", "=", hostUserId)
    .where("expires_at", ">", new Date())
    .orderBy("created_at", "desc")
    .execute();
}

export async function deleteRoom(code: string) {
  await db
    .deleteFrom("rooms")
    .where("code", "=", code)
    .execute();
}

export async function cleanupExpiredRooms() {
  await db
    .deleteFrom("rooms")
    .where("expires_at", "<", new Date())
    .execute();
}
