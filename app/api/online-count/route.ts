import { type NextRequest } from "next/server";
import { trackActivePlayer, getActivePlayersCount, checkRateLimit } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * Menghitung baseline pemain online simulasi agar website terkesan ramai
 * secara dinamis dan natural berdasarkan jam waktu saat ini (WIB/GMT).
 */
function getSimulatedCount(): number {
  const date = new Date();
  const hour = date.getHours(); // 0-23 (UTC/Local)
  const base = 42; 
  const amplitude = 35; 
  
  // Memuncak pada jam 20:00 (8 PM) dan terendah pada jam 04:00 (4 AM)
  const angle = ((hour - 4) / 24) * 2 * Math.PI;
  const sinValue = Math.sin(angle - Math.PI / 2);
  
  const hourlyCount = Math.floor(base + amplitude * sinValue);
  
  const minute = date.getMinutes();
  const noise = (minute % 7) - 3; // -3 s/d +3
  
  return Math.max(15, hourlyCount + noise);
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  
  // Rate limit: 20 request per 60 detik per IP
  const rateLimit = await checkRateLimit(ip, "online_count", 20, 60);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
      { status: 429 }
    );
  }

  const clientId = request.nextUrl.searchParams.get("clientId")?.trim();
  
  let realCount = 0;
  try {
    if (clientId && clientId.length <= 64) {
      realCount = await trackActivePlayer(clientId);
    } else {
      realCount = await getActivePlayersCount();
    }
  } catch (err) {
    console.error("Gagal melacak keaktifan pemain:", err);
  }
  
  const simulatedCount = getSimulatedCount();
  const finalCount = realCount + simulatedCount;
  
  return Response.json({ count: finalCount });
}
