import { ImageResponse } from "next/og";

/**
 * OG / Twitter share image (1200x630).
 * Komposisi:
 * - Background yellow + dot pattern.
 * - Card "WikiRace · ID" branding di kiri atas.
 * - Headline besar + chip "Wikipedia ID" violet.
 * - Footer hint cara main.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "WikiRace Indonesia — balapan dari satu artikel Wikipedia ke artikel lain";

export default function OpengraphImage() {
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
            WikiRace Indonesia
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
          <div
            style={{
              fontWeight: 900,
              fontSize: 96,
              lineHeight: 1,
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
              artikel A
            </span>
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 96,
              lineHeight: 1,
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
              artikel B
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
          <span>Multiplayer realtime · Wikipedia Bahasa Indonesia</span>
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
