import Ably from "ably";

/**
 * Helper Ably untuk WikiRace Indonesia.
 *
 * - `getAblyClient(clientId)` — singleton untuk sisi browser. Pakai authUrl
 *   `/api/ably-auth` agar API key tidak terekspos ke client.
 * - `getAblyServer()` — singleton untuk sisi server (API Route) untuk
 *   publish pesan ke channel room.
 *
 * Env var yang dibutuhkan:
 * - ABLY_API_KEY (server only)
 */

// ---------- Client (browser) ----------

let browserClient: Ably.Realtime | null = null;

/**
 * Ambil instance Ably Realtime untuk sisi client (browser).
 * Singleton — instance hanya dibuat sekali per page session.
 *
 * @param clientId - clientId unik untuk pemain (biasanya UUID per tab).
 */
export function getAblyClient(clientId: string): Ably.Realtime {
  if (typeof window === "undefined") {
    throw new Error(
      "getAblyClient() hanya boleh dipanggil di sisi client (browser).",
    );
  }

  if (browserClient) {
    return browserClient;
  }

  browserClient = new Ably.Realtime({
    authUrl: "/api/ably-auth",
    clientId,
    // authMethod default "GET" — sesuai endpoint kita.
  });

  return browserClient;
}

/** Tutup koneksi Ably client (dipakai saat unmount halaman). */
export function closeAblyClient(): void {
  if (browserClient) {
    browserClient.close();
    browserClient = null;
  }
}

// ---------- Server (API Route) ----------

let serverClient: Ably.Rest | null = null;

/**
 * Ambil instance Ably REST untuk sisi server (API Route).
 * Dipakai untuk publish pesan ke channel `room:{roomId}` setelah
 * validasi berhasil di API Route.
 */
export function getAblyServer(): Ably.Rest {
  if (serverClient) {
    return serverClient;
  }

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ABLY_API_KEY belum di-set di environment variable. " +
        "Tambahkan ke .env.local untuk development.",
    );
  }

  serverClient = new Ably.Rest({ key: apiKey });
  return serverClient;
}

/**
 * Publish event ke channel Ably room (`room:{roomId}`).
 * Dipakai dari API Route setelah validasi + update state berhasil.
 */
export async function publishRoomEvent(
  roomId: string,
  eventName: string,
  data: unknown,
): Promise<void> {
  const channel = getAblyServer().channels.get(`room:${roomId}`);
  await channel.publish(eventName, data);
}
