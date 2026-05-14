import { ImageResponse } from "next/og";

/**
 * Favicon dinamis (32x32) — gaya Playdate.
 * Yellow square dengan border charcoal + huruf "W" tebal di tengah.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          border: "3px solid #312f27",
          borderRadius: 6,
          fontFamily: "system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: -1,
        }}
      >
        W
      </div>
    ),
    { ...size },
  );
}
