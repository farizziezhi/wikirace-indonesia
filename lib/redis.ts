import { Redis } from "@upstash/redis";

import type { Room } from "./types";

/**
 * Upstash Redis client (HTTP-based, cocok untuk serverless).
 *
 * Dibutuhkan env vars:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** Key Redis untuk satu room. */
const roomKey = (roomId: string) => `room:${roomId}`;

/** TTL default 24 jam (dalam detik). */
const ROOM_TTL_SECONDS = 60 * 60 * 24;

/**
 * Ambil state room dari Redis.
 * Mengembalikan `null` jika room tidak ditemukan / sudah expired.
 */
export async function getRoom(roomId: string): Promise<Room | null> {
  // Upstash Redis SDK otomatis JSON.parse string yang di-set lewat SDK.
  const room = await redis.get<Room>(roomKey(roomId));
  return room ?? null;
}

/**
 * Simpan state room ke Redis dengan TTL 24 jam.
 * Memanggil ulang fungsi ini akan memperpanjang TTL (refresh).
 */
export async function setRoom(room: Room): Promise<void> {
  await redis.set(roomKey(room.id), room, { ex: ROOM_TTL_SECONDS });
}

/** Hapus room dari Redis. */
export async function deleteRoom(roomId: string): Promise<void> {
  await redis.del(roomKey(roomId));
}
