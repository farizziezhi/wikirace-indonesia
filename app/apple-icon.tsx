import { ImageResponse } from "next/og";

/**
 * Apple touch icon (180x180) — versi padded dari favicon utama.
 * Tidak dibulatkan karena iOS akan mask sendiri sesuai gaya home screen-nya.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffc500",
          color: "#312f27",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 130,
          letterSpacing: -6,
          // Chunky offset shadow signature Playdate
          boxShadow: "inset 0 0 0 8px #312f27",
        }}
      >
        W
      </div>
    ),
    { ...size },
  );
}
