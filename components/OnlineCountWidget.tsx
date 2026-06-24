"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getOrCreateClientId } from "@/lib/client-id";
import { useUiLang } from "@/lib/use-ui-lang";

export default function OnlineCountWidget() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);
  const uiLang = useUiLang();
  const language = uiLang;

  useEffect(() => {
    if (pathname?.startsWith("/room/")) return;

    const clientId = getOrCreateClientId();

    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/online-count?clientId=${encodeURIComponent(clientId)}`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === "number") {
            setCount(data.count);
          }
        }
      } catch (err) {
        console.warn("Gagal mengambil jumlah pemain online:", err);
      }
    };

    void fetchCount();
    const interval = setInterval(fetchCount, 45000);
    return () => clearInterval(interval);
  }, [pathname]);

  const isRoomPage = pathname?.startsWith("/room/");
  if (isRoomPage || count === null) return null;

  return (
    <div
      className="flex items-center gap-1.5 bg-pure-white text-charcoal-text border-2 border-charcoal-text px-2.5 py-1 rounded-full text-xs font-black shadow-[1.5px_1.5px_0px_#000] select-none"
      title={language === "en" ? "Active players online" : "Pemain aktif saat ini"}
    >
      <span className="inline-flex rounded-full h-2 w-2 bg-green-500" />
      <span className="tabular-nums">
        {count} {language === "en" ? "Online" : "Aktif"}
      </span>
    </div>
  );
}
