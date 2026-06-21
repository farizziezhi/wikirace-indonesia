"use client";

/**
 * Global loading skeleton — ditampilkan Next.js saat Suspense boundary
 * menunggu halaman atau data selesai dimuat. Bertema cyber-neobrutalism.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm-cream flex items-center justify-center p-4">
      <div
        className="relative bg-pure-white border-2 border-charcoal-text p-8 text-center max-w-md w-full"
        style={{
          borderRadius: "var(--radius-rounded)",
          boxShadow: "6px 6px 0px #282C20",
        }}
      >
        {/* Checkered racing stripe */}
        <div className="absolute top-0 left-0 right-0 h-3 overflow-hidden" style={{ borderRadius: "var(--radius-rounded) var(--radius-rounded) 0 0" }}>
          <div
            className="w-full h-full"
            style={{
              background: "repeating-conic-gradient(#282C20 0% 25%, #D2FF00 0% 50%) 0 0 / 12px 12px",
            }}
          />
        </div>

        {/* Animated pulsing logo */}
        <div className="mt-4 mb-6">
          <div className="inline-block text-4xl animate-pulse">🏁</div>
        </div>

        {/* Skeleton loading bar */}
        <div className="space-y-3 mb-6">
          <div className="h-4 bg-light-beige rounded-sm overflow-hidden">
            <div
              className="h-full bg-lime-accent"
              style={{
                width: "75%",
                animation: "shimmer 1.5s ease-in-out infinite",
              }}
            />
          </div>
          <div className="h-3 bg-light-beige rounded-sm overflow-hidden">
            <div
              className="h-full bg-warm-gray"
              style={{
                width: "50%",
                animation: "shimmer 1.5s ease-in-out 0.2s infinite",
              }}
            />
          </div>
          <div className="h-3 bg-light-beige rounded-sm overflow-hidden">
            <div
              className="h-full bg-warm-gray"
              style={{
                width: "60%",
                animation: "shimmer 1.5s ease-in-out 0.4s infinite",
              }}
            />
          </div>
        </div>

        <p className="font-mono text-xs text-medium-gray tracking-wider uppercase">
          Loading...
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}} />
    </div>
  );
}
