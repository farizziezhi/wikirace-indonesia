/**
 * Tipe data inti WikiRace Indonesia.
 * State room disimpan di Upstash Redis dengan key `room:{roomId}`.
 */

export interface RouteStep {
  /** Judul artikel Wikipedia */
  article: string;
  /** Detik sejak game dimulai */
  timestamp: number;
}

export type PlayerStatus = "waiting" | "playing" | "finished" | "surrendered";

export interface Player {
  /** Ably clientId (unique per koneksi) */
  clientId: string;
  username: string;
  isHost: boolean;
  status: PlayerStatus;
  currentArticle: string;
  /** Riwayat semua artikel yang dilewati pemain */
  route: RouteStep[];
  /** Timestamp saat menang (undefined jika belum) */
  finishedAt?: number;
}

export type RoomStatus = "lobby" | "playing" | "finished";

export interface Room {
  /** 6 karakter, e.g. "ABC123" */
  id: string;
  /** Ably clientId host */
  hostClientId: string;
  status: RoomStatus;
  /** Judul artikel Wikipedia awal */
  startArticle: string;
  /** Judul artikel Wikipedia tujuan */
  endArticle: string;
  players: Player[];
  /** Timestamp room dibuat */
  createdAt: number;
  /** Timestamp saat game dimulai (ms). Hanya ada saat status 'playing' / 'finished'. */
  startTime?: number;
}
