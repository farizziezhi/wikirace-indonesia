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
  token?: string,
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
    token,
  };
}

/** Salin objek Player tanpa menyertakan secret token agar tidak bocor ke client. */
export function sanitizePlayer(player: Player): Player {
  const { token, ...rest } = player;
  return rest as Player;
}

/** Salin objek Room dengan menyensor/menghapus secret token di setiap pemain. */
export function sanitizeRoom(room: Room): Room {
  return {
    ...room,
    players: room.players.map(sanitizePlayer),
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

const API_ERROR_TRANSLATIONS: Record<string, { id: string; en: string }> = {
  "roomId wajib diisi.": {
    id: "roomId wajib diisi.",
    en: "roomId is required.",
  },
  "clientId wajib diisi.": {
    id: "clientId wajib diisi.",
    en: "clientId is required.",
  },
  "targetClientId wajib diisi.": {
    id: "targetClientId wajib diisi.",
    en: "targetClientId is required.",
  },
  "Room tidak ditemukan.": {
    id: "Room tidak ditemukan.",
    en: "Room not found.",
  },
  "Akses ditolak: Sesi tidak cocok.": {
    id: "Akses ditolak: Sesi tidak cocok.",
    en: "Access denied: Session mismatch.",
  },
  "Akses ditolak: Sesi tidak cocok dengan clientId pengirim.": {
    id: "Akses ditolak: Sesi tidak cocok dengan clientId pengirim.",
    en: "Access denied: Session mismatch with sender clientId.",
  },
  "Akses ditolak: Token tidak cocok.": {
    id: "Akses ditolak: Token tidak cocok.",
    en: "Access denied: Token mismatch.",
  },
  "Body harus JSON valid.": {
    id: "Body harus JSON valid.",
    en: "Body must be valid JSON.",
  },
  "Terjadi kesalahan internal server.": {
    id: "Terjadi kesalahan internal server.",
    en: "Internal server error.",
  },
  "Terjadi kesalahan server internal.": {
    id: "Terjadi kesalahan server internal.",
    en: "Internal server error.",
  },
  "Pemain tidak ada di room ini.": {
    id: "Pemain tidak ada di room ini.",
    en: "Player is not in this room.",
  },
  "Hanya host yang boleh memulai game.": {
    id: "Hanya host yang boleh memulai game.",
    en: "Only the host can start the game.",
  },
  "Hanya pemain dalam room yang boleh memulai game.": {
    id: "Hanya pemain dalam room yang boleh memulai game.",
    en: "Only players in the room can start the game.",
  },
  "Minimal 2 pemain untuk memulai game.": {
    id: "Minimal 2 pemain untuk memulai game.",
    en: "At least 2 players are required to start the game.",
  },
  "Game sudah dimulai atau sudah selesai.": {
    id: "Game sudah dimulai atau sudah selesai.",
    en: "Game has already started or finished.",
  },
  "Artikel start dan finish belum diatur.": {
    id: "Artikel start dan finish belum diatur.",
    en: "Start and finish articles have not been set.",
  },
  "Hanya host yang boleh mengatur artikel.": {
    id: "Hanya host yang boleh mengatur artikel.",
    en: "Only the host can configure articles.",
  },
  "Artikel pada Ranked Matchmaking tidak boleh diubah manual.": {
    id: "Artikel pada Ranked Matchmaking tidak boleh diubah manual.",
    en: "Ranked Matchmaking articles cannot be changed manually.",
  },
  "Artikel hanya bisa diatur saat di lobby.": {
    id: "Artikel hanya bisa diatur saat di lobby.",
    en: "Articles can only be set in the lobby.",
  },
  "Gagal generate artikel random. Coba lagi.": {
    id: "Gagal generate artikel random. Coba lagi.",
    en: "Failed to generate random articles. Try again.",
  },
  "Bantuan hanya bisa digunakan saat permainan berlangsung.": {
    id: "Bantuan hanya bisa digunakan saat permainan berlangsung.",
    en: "Help can only be used during active gameplay.",
  },
  "Pemain hanya bisa disuspen saat permainan berlangsung.": {
    id: "Pemain hanya bisa disuspen saat permainan berlangsung.",
    en: "Players can only be suspended during active gameplay.",
  },
  "Game tidak dalam status 'playing'.": {
    id: "Game tidak dalam status 'playing'.",
    en: "Game is not in 'playing' status.",
  },
  "Anda harus login untuk bergabung ke room Ranked.": {
    id: "Anda harus login untuk bergabung ke room Ranked.",
    en: "You must be logged in to join Ranked rooms.",
  },
  "Anda harus login untuk bermain Ranked.": {
    id: "Anda harus login untuk bermain Ranked.",
    en: "You must be logged in to play Ranked.",
  },
  "Ranked Matchmaking room hanya dapat dimasuki melalui antrean matchmaking otomatis.": {
    id: "Ranked Matchmaking room hanya dapat dimasuki melalui antrean matchmaking otomatis.",
    en: "Ranked Matchmaking rooms can only be entered via the matchmaking queue.",
  },
  "Room sudah memulai permainan.": {
    id: "Room sudah memulai permainan.",
    en: "The room has already started the game.",
  },
  "Pesan chat tidak boleh kosong.": {
    id: "Pesan chat tidak boleh kosong.",
    en: "Chat message cannot be empty.",
  },
  "Pesan chat terlalu panjang.": {
    id: "Pesan chat terlalu panjang.",
    en: "Chat message is too long.",
  },
  "Anda tidak bisa mengirim chat jika tidak sedang bermain atau di lobi.": {
    id: "Anda tidak bisa mengirim chat jika tidak sedang bermain atau di lobi.",
    en: "You cannot chat if you are not active in the room.",
  },
  "Bantuan 'Kembali ke Awal' hanya bisa digunakan 1 kali.": {
    id: "Bantuan 'Kembali ke Awal' hanya bisa digunakan 1 kali.",
    en: "Help 'Back to Start' can only be used once.",
  },
  "Kamu sedang ditangguhkan, tidak bisa menggunakan bantuan.": {
    id: "Kamu sedang ditangguhkan, tidak bisa menggunakan bantuan.",
    en: "You are currently suspended and cannot use help.",
  },
  "Tindakan curang terdeteksi: Panggilan bantuan ditolak.": {
    id: "Tindakan curang terdeteksi: Panggilan bantuan ditolak.",
    en: "Cheating detected: Help request denied.",
  },
  "Pemain tidak dalam status 'playing'.": {
    id: "Pemain tidak dalam status 'playing'.",
    en: "Player is not in 'playing' status.",
  },
  "Pemain tidak ditemukan setelah bantuan.": {
    id: "Pemain tidak ditemukan setelah bantuan.",
    en: "Player not found after using help.",
  },
  "Pemain tidak ditemukan setelah suspensi.": {
    id: "Pemain tidak ditemukan setelah suspensi.",
    en: "Player not found after suspension.",
  },
  "Pemain pemanggil tidak ada di room.": {
    id: "Pemain pemanggil tidak ada di room.",
    en: "Caller player is not in the room.",
  },
  "Pemain target tidak ditemukan di room.": {
    id: "Pemain target tidak ditemukan di room.",
    en: "Target player not found in the room.",
  },
  "Tidak bisa mengeluarkan pemain yang sudah ready.": {
    id: "Tidak bisa mengeluarkan pemain yang sudah ready.",
    en: "Cannot kick players who are already ready.",
  },
  "Waktu bersiap belum habis.": {
    id: "Waktu bersiap belum habis.",
    en: "Preparation time has not expired yet.",
  },
  "Waktu bersiap belum diatur.": {
    id: "Waktu bersiap belum diatur.",
    en: "Preparation time has not been set.",
  },
  "Hanya untuk Ranked Matchmaking.": {
    id: "Hanya untuk Ranked Matchmaking.",
    en: "Only for Ranked Matchmaking.",
  },
  "Gagal memproses ELO.": {
    id: "Gagal memproses ELO.",
    en: "Failed to process ELO.",
  },
  "Gagal mengundang bot matchmaking.": {
    id: "Gagal mengundang bot matchmaking.",
    en: "Failed to invite matchmaking bot.",
  },
  "Bot hanya diperbolehkan bergabung dalam Ranked Matchmaking.": {
    id: "Bot hanya diperbolehkan bergabung dalam Ranked Matchmaking.",
    en: "Bots are only allowed to join Ranked Matchmaking.",
  },
  "Bot hanya bisa masuk jika Anda sendirian di dalam lobi.": {
    id: "Bot hanya bisa masuk jika Anda sendirian di dalam lobi.",
    en: "Bots can only join if you are alone in the lobby.",
  },
  "Mohon tunggu sedikit lebih lama sebelum mengundang bot.": {
    id: "Mohon tunggu sedikit lebih lama sebelum mengundang bot.",
    en: "Please wait a bit longer before inviting a bot.",
  },
  "Anda tidak bisa mengubah status ready pemain lain.": {
    id: "Anda tidak bisa mengubah status ready pemain lain.",
    en: "You cannot change other players' ready status.",
  },
  "Hanya host yang bisa mengubah status ready bot.": {
    id: "Hanya host yang bisa mengubah status ready bot.",
    en: "Only the host can change a bot's ready status.",
  },
  "Pemain target bukan bot.": {
    id: "Pemain target bukan bot.",
    en: "Target player is not a bot.",
  },
  "Pengirim tidak ditemukan di room ini.": {
    id: "Pengirim tidak ditemukan di room ini.",
    en: "Sender not found in this room.",
  },
  "Pengirim tidak boleh bot.": {
    id: "Pengirim tidak boleh bot.",
    en: "Sender cannot be a bot.",
  },
  "Bot tidak ditemukan di room ini.": {
    id: "Bot tidak ditemukan di room ini.",
    en: "Bot not found in this room.",
  },
  "Pemain sudah menyerah.": {
    id: "Pemain sudah menyerah.",
    en: "Player has already surrendered.",
  },
  "Pemain sudah finish.": {
    id: "Pemain sudah finish.",
    en: "Player has already finished.",
  },
  "Pilihan ban tidak valid.": {
    id: "Pilihan power-up tidak valid.",
    en: "Invalid power-up selection.",
  },
  "Pit stop hanya boleh digunakan 1 kali per balapan.": {
    id: "Power-up hanya boleh digunakan 1 kali per permainan.",
    en: "Power-up can only be used once per match.",
  },
  "Pilihan ban tidak boleh kosong.": {
    id: "Pilihan power-up tidak boleh kosong.",
    en: "Power-up selection cannot be empty.",
  },
  "Pemain belum mencapai garis finish.": {
    id: "Pemain belum mencapai garis finish.",
    en: "Player has not reached the finish line yet.",
  },
  "Artikel tujuan tidak cocok.": {
    id: "Artikel tujuan tidak cocok.",
    en: "Target article does not match.",
  },
  "Tindakan curang terdeteksi: Navigasi ditolak.": {
    id: "Tindakan curang terdeteksi: Navigasi ditolak.",
    en: "Cheating detected: Navigation denied.",
  },
  "Akses ditolak: Proteksi CSRF memblokir request ini.": {
    id: "Akses ditolak: Proteksi CSRF memblokir request ini.",
    en: "Access denied: CSRF protection blocked this request.",
  }
};

function translateApiError(message: string, lang: string): string {
  if (lang !== "en") return message;
  const translation = API_ERROR_TRANSLATIONS[message];
  return translation ? translation.en : message;
}

/** Helper: response error JSON yang konsisten. */
export function errorResponse(message: string, status = 400): Response {
  let lang = "id";
  if (typeof window === "undefined") {
    try {
      // Synchronous lazy dynamic require to prevent bundling next/headers on the client
      const { headers } = require("next/headers");
      const headersList = headers();
      let acceptLanguage = "";
      if (
        headersList &&
        typeof headersList.then !== "function" &&
        typeof headersList.get === "function"
      ) {
        acceptLanguage = headersList.get("accept-language") || "";
      }
      if (acceptLanguage.toLowerCase().startsWith("en")) {
        lang = "en";
      }
    } catch {
      // Fallback
    }
  }

  const translated = translateApiError(message, lang);
  return Response.json({ error: translated }, { status });
}
