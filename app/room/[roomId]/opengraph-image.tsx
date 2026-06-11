import { ImageResponse } from "next/og";
import { getRoom } from "@/lib/redis";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "WikiRace Indonesia — Balapan dari satu artikel Wikipedia ke artikel lain";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const normalizedRoomId = roomId.toUpperCase();
  const room = await getRoom(normalizedRoomId);

  const start = room?.startArticle ?? "Artikel A";
  const end = room?.endArticle ?? "Artikel B";

  let statusText = "Multiplayer realtime · Wikipedia Bahasa Indonesia";
  let winnerText = "";
  let showWinner = false;

  if (room) {
    if (room.status === "lobby") {
      statusText = `Room ${normalizedRoomId} · Menunggu Pemain...`;
    } else if (room.status === "playing") {
      statusText = `Room ${normalizedRoomId} · Balapan Sedang Berlangsung!`;
    } else if (room.status === "finished") {
      statusText = `Room ${normalizedRoomId} · Balapan Selesai!`;
      
      // Hitung pemenang dari status "finished"
      const players = [...room.players];
      const finishedPlayers = players.filter((p) => p.status === "finished");
      if (finishedPlayers.length > 0) {
        finishedPlayers.sort((a, b) => {
          const af = a.finishedAt ?? Number.MAX_SAFE_INTEGER;
          const bf = b.finishedAt ?? Number.MAX_SAFE_INTEGER;
          return af - bf;
        });
        winnerText = `🏆 Juara: ${finishedPlayers[0].username}`;
        showWinner = true;
      } else {
        winnerText = "Semua pemain menyerah!";
        showWinner = true;
      }
    }
  } else {
    statusText = `Room ${normalizedRoomId} · Tidak Ditemukan`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 64,
          background: "#ffc500",
          backgroundImage:
            "radial-gradient(rgba(49,47,39,0.18) 2px, transparent 2px)",
          backgroundSize: "32px 32px",
          color: "#312f27",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#312f27",
              color: "#ffffff",
              borderRadius: 12,
              fontWeight: 900,
              fontSize: 36,
              boxShadow: "6px 6px 0 0 #312f27",
            }}
          >
            W
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            WikiRace · ID
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: "auto",
          }}
        >
          {showWinner && (
            <div
              style={{
                background: "#312f27",
                color: "#ffffff",
                padding: "10px 24px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 28,
                alignSelf: "flex-start",
                marginBottom: 8,
                boxShadow: "6px 6px 0 0 rgba(0,0,0,0.15)",
              }}
            >
              {winnerText}
            </div>
          )}
          <div
            style={{
              fontWeight: 900,
              fontSize: 80,
              lineHeight: 1.1,
              letterSpacing: -3,
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "baseline",
            }}
          >
            <span>Lompat dari</span>
            <span
              style={{
                background: "#ffffff",
                border: "4px solid #312f27",
                borderRadius: 12,
                padding: "0 18px",
                boxShadow: "8px 8px 0 0 #312f27",
              }}
            >
              {start}
            </span>
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 80,
              lineHeight: 1.1,
              letterSpacing: -3,
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "baseline",
            }}
          >
            <span>ke</span>
            <span
              style={{
                background: "#7700ff",
                color: "#ffffff",
                border: "4px solid #312f27",
                borderRadius: 12,
                padding: "0 18px",
                boxShadow: "8px 8px 0 0 #312f27",
              }}
            >
              {end}
            </span>
            <span>.</span>
          </div>
        </div>

        {/* Footer hint */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 56,
            fontSize: 26,
            fontWeight: 600,
            color: "#312f27",
          }}
        >
          <span>{statusText}</span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#312f27",
              color: "#ffc500",
              padding: "10px 22px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: 1,
            }}
          >
            wikiraceid.web.id
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
