/**
 * Helper logic room yang dipakai bersama oleh API Routes.
 * Tidak ada side effect — fungsi murni untuk validasi & manipulasi state room.
 */

import type { Player, Room, RouteStep } from "./types";

/** Maksimum pemain per room. */
export const MAX_PLAYERS = 8;

/** Limit panjang input dari client untuk mencegah penyalahgunaan. */
export const MAX_USERNAME_LENGTH = 20;
export const MAX_ARTICLE_TITLE_LENGTH = 200;
export const MAX_CLIENT_ID_LENGTH = 64;
export const MAX_CHAT_LENGTH = 200;

export const ALLOWED_EMOJIS = ["🔥", "😂", "👏", "💀", "🎉", "😤"] as const;

/** Karakter yang dipakai untuk roomId (hindari 0/O dan 1/I supaya mudah dibaca). */
const ROOM_ID_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Generate roomId 6 karakter (huruf kapital + angka). */
export function generateRoomId(length = 6): string {
  let id = "";
  for (let i = 0; i < length; i++) {
    id += ROOM_ID_CHARSET.charAt(
      Math.floor(Math.random() * ROOM_ID_CHARSET.length),
    );
  }
  return id;
}

/** Cari player di room berdasarkan clientId. */
export function findPlayer(room: Room, clientId: string): Player | undefined {
  return room.players.find((p) => p.clientId === clientId);
}

/** Bentuk Player baru untuk pemain yang join room. */
export function createPlayer(
  clientId: string,
  username: string,
  isHost: boolean,
): Player {
  return {
    clientId,
    username,
    isHost,
    status: "waiting",
    currentArticle: "",
    route: [],
    suspendedUntil: 0,
    helpUsed: false,
    ready: false,
  };
}

/** Bentuk RouteStep baru relatif terhadap waktu game dimulai. */
export function createRouteStep(article: string, startTime: number): RouteStep {
  return {
    article,
    timestamp: Math.max(0, (Date.now() - startTime) / 1000),
  };
}

/**
 * Bentuk objek `allRoutes` standar untuk dipublish ke client
 * (event `game_won` / `game_surrendered`).
 */
export function buildAllRoutes(room: Room): Array<{
  clientId: string;
  username: string;
  status: Player["status"];
  route: RouteStep[];
  finishedAt?: number;
}> {
  return room.players.map((p) => ({
    clientId: p.clientId,
    username: p.username,
    status: p.status,
    route: p.route,
    finishedAt: p.finishedAt,
  }));
}

/** Helper: response error JSON yang konsisten. */
export function errorResponse(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}
