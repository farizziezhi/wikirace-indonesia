"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PlayerStats {
  username: string;
  elo: number;
  games_played: number;
  wins: number;
  losses: number;
  equipped_title?: string;
  daily_streak?: number;
  last_daily_challenge_completed_at?: string;
}

interface PlayerMatch {
  id: number;
  elo_change: number;
  start_article: string;
  end_article: string;
  clicks: number;
  duration: number;
  won: number;
  played_at: number;
}

interface TitleItem {
  id: string;
  nameId: string;
  nameEn: string;
  descId: string;
  descEn: string;
  isEligible: (stats: PlayerStats | null) => boolean;
}

const TITLES: TitleItem[] = [
  {
    id: "novice",
    nameId: "Pemula Wikipedia",
    nameEn: "Wikipedia Rookie",
    descId: "Gelar bawaan untuk semua pemain.",
    descEn: "Default title for all players.",
    isEligible: () => true,
  },
  {
    id: "explorer",
    nameId: "Penjelajah Link",
    nameEn: "Link Explorer",
    descId: "Capai rating ELO minimal 1100.",
    descEn: "Reach ELO rating of 1100 or above.",
    isEligible: (stats) => (stats?.elo ?? 1200) >= 1100,
  },
  {
    id: "racer",
    nameId: "Pembalap Kata",
    nameEn: "Word Racer",
    descId: "Capai rating ELO minimal 1300.",
    descEn: "Reach ELO rating of 1300 or above.",
    isEligible: (stats) => (stats?.elo ?? 1200) >= 1300,
  },
  {
    id: "knight",
    nameId: "Ksatria Artikel",
    nameEn: "Article Knight",
    descId: "Capai rating ELO minimal 1500.",
    descEn: "Reach ELO rating of 1500 or above.",
    isEligible: (stats) => (stats?.elo ?? 1200) >= 1500,
  },
  {
    id: "legend",
    nameId: "Legenda WikiRace",
    nameEn: "WikiRace Legend",
    descId: "Capai rating ELO minimal 1700.",
    descEn: "Reach ELO rating of 1700 or above.",
    isEligible: (stats) => (stats?.elo ?? 1200) >= 1700,
  },
  {
    id: "champion",
    nameId: "Juara Bertahan",
    nameEn: "Reigning Champion",
    descId: "Menangkan minimal 50 kali pertandingan.",
    descEn: "Win at least 50 games.",
    isEligible: (stats) => (stats?.wins ?? 0) >= 50,
  },
  {
    id: "veteran",
    nameId: "Veteran Penjelajah",
    nameEn: "Veteran Explorer",
    descId: "Mainkan minimal 100 kali pertandingan.",
    descEn: "Play at least 100 games.",
    isEligible: (stats) => (stats?.games_played ?? 0) >= 100,
  },
  {
    id: "doctor",
    nameId: "Doktor Wiki",
    nameEn: "Wiki Doctor",
    descId: "Menangkan minimal 10 pertandingan dengan win rate >= 70%.",
    descEn: "Win at least 10 games with win rate >= 70%.",
    isEligible: (stats) => {
      const wins = stats?.wins ?? 0;
      const games = stats?.games_played ?? 0;
      const winRate = games > 0 ? wins / games : 0;
      return wins >= 10 && winRate >= 0.7;
    },
  },
];

interface AchievementItem {
  id: string;
  nameId: string;
  nameEn: string;
  descId: string;
  descEn: string;
  icon: string;
  isUnlocked: (stats: PlayerStats | null) => boolean;
}

const ACHIEVEMENTS: AchievementItem[] = [
  {
    id: "first_win",
    nameId: "Kemenangan Pertama",
    nameEn: "First Victory",
    descId: "Berhasil memenangkan 1 pertandingan ranked.",
    descEn: "Win 1 ranked match.",
    icon: "🏆",
    isUnlocked: (stats) => (stats?.wins ?? 0) >= 1,
  },
  {
    id: "dedicated",
    nameId: "Pembalap Setia",
    nameEn: "Dedicated Racer",
    descId: "Mainkan total 25 pertandingan ranked.",
    descEn: "Play 25 total ranked matches.",
    icon: "⚡",
    isUnlocked: (stats) => (stats?.games_played ?? 0) >= 25,
  },
  {
    id: "elite",
    nameId: "Pembalap Elit",
    nameEn: "Elite Racer",
    descId: "Capai rating ELO minimal 1400.",
    descEn: "Reach ELO rating of 1400 or above.",
    icon: "👑",
    isUnlocked: (stats) => (stats?.elo ?? 1200) >= 1400,
  },
  {
    id: "conqueror",
    nameId: "Sang Penakluk",
    nameEn: "The Conqueror",
    descId: "Menangkan total 100 pertandingan ranked.",
    descEn: "Win 100 total ranked matches.",
    icon: "⚔️",
    isUnlocked: (stats) => (stats?.wins ?? 0) >= 100,
  },
];

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();

  const [uiLanguage, setUiLanguage] = useState<"id" | "en">("id");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Data target profil
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [matches, setMatches] = useState<PlayerMatch[]>([]);

  // Sesi pengguna saat ini yang sedang aktif login
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [titleLoading, setTitleLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // Deteksi bahasa browser
    if (typeof window !== "undefined") {
      const savedLang = window.localStorage.getItem("wikirace:lang");
      if (savedLang === "en" || savedLang === "id") {
        setUiLanguage(savedLang);
      }
    }

    void loadProfile();
    void checkSession();
  }, [username]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const tId = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(tId);
  }, [toast]);

  async function checkSession() {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.loggedIn) {
        setCurrentUser(data.username);
      }
    } catch {
      // ignore
    }
  }

  async function loadProfile() {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setProfileError(data.error ?? "Gagal memuat profil.");
      } else {
        setStats(data.stats);
        setMatches(data.matches || []);
      }
    } catch {
      setProfileError("Koneksi gagal ke server.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleEquipTitle(titleName: string) {
    setTitleLoading(titleName);
    try {
      const res = await fetch("/api/profile/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleName }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setToast(data.error ?? "Gagal memperbarui gelar.");
      } else {
        setToast(uiLanguage === "en" ? "Title equipped successfully!" : "Gelar berhasil dipasang!");
        // Update stats lokal
        if (stats) {
          setStats({ ...stats, equipped_title: titleName });
        }
      }
    } catch {
      setToast("Gagal terhubung ke server.");
    } finally {
      setTitleLoading(null);
    }
  }

  const isOwner = currentUser && currentUser.toLowerCase() === username.toLowerCase();

  // Hitung winrate
  const winRate = stats && stats.games_played > 0 
    ? Math.round((stats.wins / stats.games_played) * 100) 
    : 0;

  // Mendapatkan tier warna ELO
  const eloVal = stats?.elo ?? 1200;
  let tierName = "";
  let tierColor = "";
  let tierBg = "";
  if (eloVal < 1100) {
    tierName = uiLanguage === "en" ? "Novice" : "Pemula";
    tierColor = "#FF6B00";
    tierBg = "rgba(255, 107, 0, 0.1)";
  } else if (eloVal < 1300) {
    tierName = uiLanguage === "en" ? "Explorer" : "Penjelajah";
    tierColor = "#B2C73A";
    tierBg = "rgba(178, 199, 58, 0.1)";
  } else {
    tierName = uiLanguage === "en" ? "Speedrunner" : "Legenda";
    tierColor = "#D2FF00";
    tierBg = "rgba(210, 255, 0, 0.1)";
  }

  return (
    <main className="dot-bg flex min-h-screen w-full flex-col items-center px-4 pt-8 pb-32 sm:px-6 sm:pt-12 sm:pb-36">
      <div className="w-full max-w-[850px] flex flex-col gap-6">
        
        {/* Checkered Racing Stripe Banner */}
        <div className="h-5 w-full bg-charcoal-text border-3 border-charcoal-text shadow-[4px_4px_0px_#282c20] rounded-xl overflow-hidden flex">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? "bg-pure-white" : "bg-charcoal-text"}`} />
          ))}
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="chunky-press bg-charcoal-text text-warm-cream font-extrabold text-xs uppercase px-4 py-2.5 border-2 border-charcoal-text shadow-[3px_3px_0px_#000] rounded-lg transition-transform"
          >
            ← {uiLanguage === "en" ? "Back to Home" : "Kembali ke Beranda"}
          </Link>
          <span className="font-extrabold text-charcoal-text text-[11px] uppercase tracking-wider bg-pure-white border-2 border-charcoal-text px-3 py-1.5 shadow-[2px_2px_0px_#000] rounded-lg">
            🏁 WIKIRACE ID PROFILE
          </span>
        </div>

        {toast && (
          <div className="bg-lime-accent text-charcoal-text border-3 border-charcoal-text p-3.5 text-center text-sm font-black shadow-[4px_4px_0px_#000] rounded-xl animate-bounce">
            {toast}
          </div>
        )}

        {profileLoading ? (
          <div className="chunky-lg bg-pure-white p-16 text-center flex flex-col items-center justify-center gap-4 border-3 border-charcoal-text shadow-[6px_6px_0px_#000]">
            <div className="border-charcoal-text border-t-transparent animate-spin rounded-full w-9 h-9 border-4" />
            <span className="font-black text-charcoal-text uppercase text-sm tracking-wider">
              {uiLanguage === "en" ? "Loading profile data..." : "Memuat data profil..."}
            </span>
          </div>
        ) : profileError ? (
          <div className="chunky-lg bg-pure-white p-12 text-center flex flex-col items-center justify-center gap-4 border-3 border-burnt-orange shadow-[6px_6px_0px_#000] rounded-xl">
            <span className="text-4xl animate-pulse">⚠️</span>
            <span className="font-black text-charcoal-text text-lg uppercase tracking-wide">{profileError}</span>
            <Link href="/" className="btn-primary mt-2">
              {uiLanguage === "en" ? "Back to Home" : "Kembali ke Beranda"}
            </Link>
          </div>
        ) : (
          <>
            {/* ====== Profile Header Card ====== */}
            <section
              className="relative overflow-hidden flex flex-col sm:flex-row items-center gap-5 p-6 bg-charcoal-text text-warm-cream border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
              style={{ borderRadius: "var(--radius-input)" }}
            >
              {/* Checkered side accent */}
              <div className="absolute top-0 right-0 h-full w-2 bg-gradient-to-b from-lime-accent to-lime-deep opacity-80" />

              {/* Avatar circle */}
              <div
                className="flex shrink-0 items-center justify-center font-black uppercase text-pure-white text-3xl border-3 border-pure-white shadow-[4px_4px_0px_#000] hover:scale-105 transition-transform duration-200 cursor-default"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: `hsl(${(username.length * 37) % 360}, 65%, 45%)`,
                }}
              >
                {username.slice(0, 2).toUpperCase()}
              </div>

              {/* Username & Title */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
                  <h1 className="font-black text-3xl tracking-tight truncate">
                    {username}
                  </h1>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span
                      className="inline-block self-center font-black px-2.5 py-1 rounded text-[10px] uppercase border-2 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
                      style={{ color: tierColor, backgroundColor: tierBg, borderColor: tierColor }}
                    >
                      {tierName}
                    </span>
                    {stats ? (
                      stats.daily_streak && stats.daily_streak > 0 ? (
                        <span
                          className={`inline-block self-center font-black px-2.5 py-1 rounded text-[10px] uppercase border-2 shadow-[2px_2px_0px_rgba(0,0,0,0.2)] ${
                            stats.daily_streak >= 7
                              ? "animate-bounce bg-gradient-to-r from-lime-accent to-lime-deep text-charcoal-text border-charcoal-text"
                              : stats.daily_streak >= 3
                              ? "animate-pulse bg-[#FF5500] text-warm-cream border-charcoal-text"
                              : "bg-[#FF8A00] text-charcoal-text border-charcoal-text"
                          }`}
                        >
                          🔥 {stats.daily_streak} {uiLanguage === "en" ? "Day Streak" : "Hari Streak"}
                        </span>
                      ) : (
                        <span
                          className="inline-block self-center font-black px-2.5 py-1 rounded text-[10px] uppercase border-2 border-dashed border-warm-gray/40 text-warm-cream/30 bg-warm-cream/5 cursor-default"
                          title={uiLanguage === "en" ? "No active daily streak" : "Tidak ada streak harian aktif"}
                        >
                          🔥 0 {uiLanguage === "en" ? "Streak" : "Streak"}
                        </span>
                      )
                    ) : null}
                  </div>
                </div>
                
                <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {stats?.equipped_title ? (
                    <span className="inline-flex items-center gap-1.5 bg-lime-accent text-charcoal-text font-black text-xs px-3 py-1 rounded-full border-2 border-charcoal-text shadow-[2px_2px_0px_rgba(0,0,0,0.15)] uppercase tracking-wide">
                      🏆 {stats.equipped_title}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-warm-cream/10 text-warm-cream/50 text-[10px] font-bold px-2.5 py-1 rounded-full border border-dashed border-warm-cream/20 uppercase tracking-wider">
                      {uiLanguage === "en" ? "No equipped title" : "Belum ada gelar aktif"}
                    </span>
                  )}
                  <span className="text-[10px] text-warm-cream/40 font-bold uppercase tracking-wider ml-1">
                    • Joined {new Date().getFullYear()}
                  </span>
                </div>
              </div>
            </section>

            {/* ====== Statistics Section ====== */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-pure-white border-3 border-charcoal-text p-4 rounded-xl shadow-[4px_4px_0px_#000] hover:-translate-y-1 hover:translate-x-0.5 hover:shadow-[5px_5px_0px_#000] transition-all duration-200 cursor-default">
                <span className="text-[10px] font-black uppercase text-charcoal-text/50 tracking-wider">ELO Rating</span>
                <p className="text-3xl font-black text-charcoal-text mt-1">{stats?.elo ?? 1200}</p>
              </div>

              <div className="bg-pure-white border-3 border-charcoal-text p-4 rounded-xl shadow-[4px_4px_0px_#000] hover:-translate-y-1 hover:translate-x-0.5 hover:shadow-[5px_5px_0px_#000] transition-all duration-200 cursor-default">
                <span className="text-[10px] font-black uppercase text-charcoal-text/50 tracking-wider">Win Rate</span>
                <p className="text-3xl font-black text-charcoal-text mt-1">{winRate}%</p>
                <div className="w-full bg-light-beige h-3.5 border-2 border-charcoal-text rounded-full overflow-hidden mt-2 p-[1px]">
                  <div className="bg-lime-accent h-full rounded-full border-r border-charcoal-text" style={{ width: `${winRate}%` }} />
                </div>
              </div>

              <div className="bg-pure-white border-3 border-charcoal-text p-4 rounded-xl shadow-[4px_4px_0px_#000] hover:-translate-y-1 hover:translate-x-0.5 hover:shadow-[5px_5px_0px_#000] transition-all duration-200 cursor-default">
                <span className="text-[10px] font-black uppercase text-charcoal-text/50 tracking-wider">Total Main</span>
                <p className="text-3xl font-black text-charcoal-text mt-1">{stats?.games_played ?? 0}</p>
              </div>

              <div className="bg-pure-white border-3 border-charcoal-text p-4 rounded-xl shadow-[4px_4px_0px_#000] hover:-translate-y-1 hover:translate-x-0.5 hover:shadow-[5px_5px_0px_#000] transition-all duration-200 cursor-default">
                <span className="text-[10px] font-black uppercase text-charcoal-text/50 tracking-wider">Hasil (W / L)</span>
                <p className="text-2xl font-black text-charcoal-text mt-1">
                  {stats?.wins ?? 0}
                  <span className="text-xs text-charcoal-text/40 font-bold mx-1">vs</span>
                  {stats?.losses ?? 0}
                </p>
                <div className="flex gap-1.5 mt-2.5">
                  <span className="bg-lime-accent/20 text-charcoal-text border border-lime-accent/50 px-2 py-0.5 rounded text-[10px] font-extrabold">{stats?.wins ?? 0} W</span>
                  <span className="bg-burnt-orange/20 text-burnt-orange border border-burnt-orange/30 px-2 py-0.5 rounded text-[10px] font-extrabold">{stats?.losses ?? 0} K</span>
                </div>
              </div>
            </section>

            {/* ====== Titles & Achievements Block ====== */}
            <section
              className="flex flex-col gap-4 p-6 bg-pure-white border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
              style={{ borderRadius: "var(--radius-input)" }}
            >
              <h2 className="font-black text-xl text-charcoal-text uppercase tracking-wider border-b-3 border-charcoal-text pb-2 flex items-center justify-between">
                <span>🎖️ {uiLanguage === "en" ? "Achievements" : "Prestasi & Pencapaian"}</span>
                <span className="text-xs bg-lime-accent/20 border border-lime-accent/40 px-2 py-1 rounded text-charcoal-text/70">
                  {ACHIEVEMENTS.filter(a => a.isUnlocked(stats)).length} / {ACHIEVEMENTS.length} {uiLanguage === "en" ? "Unlocked" : "Terbuka"}
                </span>
              </h2>

              {/* Achievements row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
                {ACHIEVEMENTS.map((ach) => {
                  const unlocked = ach.isUnlocked(stats);
                  return (
                    <div
                      key={ach.id}
                      className={`border-2 p-3.5 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all ${
                        unlocked 
                          ? "bg-lime-accent/10 border-lime-accent/60 text-charcoal-text shadow-[2px_2px_0px_rgba(0,0,0,0.15)]" 
                          : "bg-light-beige/30 border-warm-gray/60 text-charcoal-text/40 opacity-70"
                      }`}
                    >
                      <span className={`text-3xl transition-transform ${unlocked ? "animate-pulse scale-110" : "grayscale opacity-50"}`}>{ach.icon}</span>
                      <span className="font-black text-xs leading-tight">{uiLanguage === "en" ? ach.nameEn : ach.nameId}</span>
                      <span className="text-[9px] font-bold leading-normal text-charcoal-text/60">{uiLanguage === "en" ? ach.descEn : ach.descId}</span>
                    </div>
                  );
                })}
              </div>

              {/* Titles listing */}
              <div className="flex flex-col gap-2.5 mt-5">
                <span className="text-xs font-black uppercase text-charcoal-text/60 border-b border-warm-gray/40 pb-1.5 mb-1 flex items-center gap-1.5">
                  🏆 {uiLanguage === "en" ? "Equippable Player Titles" : "Gelar Pemain yang Dapat Dipasang"}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TITLES.map((title) => {
                    const eligible = title.isEligible(stats);
                    const isEquipped = stats?.equipped_title === (uiLanguage === "en" ? title.nameEn : title.nameId);
                    
                    return (
                      <div
                        key={title.id}
                        className={`flex items-center justify-between p-3.5 border-2 rounded-xl gap-2 transition-all ${
                          isEquipped
                            ? "bg-charcoal-text text-warm-cream border-charcoal-text shadow-[3px_3px_0px_#000]"
                            : eligible
                              ? "bg-pure-white border-charcoal-text/40 hover:border-charcoal-text shadow-[3px_3px_0px_rgba(0,0,0,0.1)] hover:shadow-[3px_3px_0px_#000] hover:bg-lime-accent/5"
                              : "bg-light-beige/10 border-warm-gray/30 opacity-60"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`font-black text-sm uppercase tracking-wide ${isEquipped ? "text-lime-accent" : "text-charcoal-text"}`}>
                            {uiLanguage === "en" ? title.nameEn : title.nameId}
                          </p>
                          <p className={`text-[9px] font-bold mt-1 leading-normal ${isEquipped ? "text-warm-cream/60" : "text-charcoal-text/50"}`}>
                            {uiLanguage === "en" ? title.descEn : title.descId}
                          </p>
                        </div>

                        {/* Action buttons */}
                        {isOwner ? (
                          isEquipped ? (
                            <span className="text-[10px] font-black uppercase text-lime-accent tracking-wider bg-lime-accent/15 border-2 border-lime-accent px-3 py-1 rounded-lg shrink-0">
                              {uiLanguage === "en" ? "ACTIVE" : "AKTIF"}
                            </span>
                          ) : eligible ? (
                            <button
                              onClick={() => handleEquipTitle(uiLanguage === "en" ? title.nameEn : title.nameId)}
                              disabled={titleLoading !== null}
                              className="chunky-press bg-lime-accent text-charcoal-text text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-charcoal-text shadow-[2px_2px_0px_#000] shrink-0 hover:bg-lime-deep active:translate-y-0.5 active:shadow-[1px_1px_0px_#000]"
                            >
                              {titleLoading === (uiLanguage === "en" ? title.nameEn : title.nameId)
                                ? "..."
                                : (uiLanguage === "en" ? "EQUIP" : "PASANG")}
                            </button>
                          ) : (
                            <span className="text-[9px] font-black text-charcoal-text/40 shrink-0 uppercase bg-charcoal-text/5 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-dashed border-charcoal-text/20">
                              🔒 {uiLanguage === "en" ? "Locked" : "Kunci"}
                            </span>
                          )
                        ) : (
                          isEquipped && (
                            <span className="text-[10px] font-black uppercase text-lime-accent tracking-wider bg-lime-accent/10 border-2 border-lime-accent/20 px-3 py-1 rounded-lg shrink-0">
                              Equipped
                            </span>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ====== Match History Block ====== */}
            <section
              className="flex flex-col gap-4 p-6 bg-pure-white border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
              style={{ borderRadius: "var(--radius-input)" }}
            >
              <h2 className="font-black text-xl text-charcoal-text uppercase tracking-wider border-b-3 border-charcoal-text pb-2 flex items-center justify-between">
                <span>⚔️ {uiLanguage === "en" ? "Recent Battles" : "Riwayat Pertandingan"}</span>
                <span className="text-xs bg-charcoal-text/10 px-2 py-1 rounded text-charcoal-text/70 font-bold">
                  {matches.length} {uiLanguage === "en" ? "Matches" : "Pertandingan"}
                </span>
              </h2>

              {matches.length === 0 ? (
                <div className="p-12 text-center bg-light-beige/30 border-3 border-dashed border-warm-gray rounded-2xl text-charcoal-text/50 font-black text-xs uppercase tracking-widest leading-relaxed">
                  {uiLanguage === "en" ? "No matches played yet." : "Belum ada riwayat pertempuran."}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {matches.map((match) => {
                    const isWin = match.won === 1;
                    const dateStr = new Date(match.played_at).toLocaleDateString(
                      uiLanguage === "en" ? "en-US" : "id-ID",
                      { day: "numeric", month: "short", year: "numeric" }
                    );

                    return (
                      <div
                        key={match.id}
                        className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-3 border-charcoal-text rounded-2xl gap-3 shadow-[4px_4px_0px_#000] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000] ${
                          isWin ? "bg-lime-accent/5" : "bg-burnt-orange/5"
                        }`}
                      >
                        {/* Match Track Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded border-2 border-charcoal-text uppercase tracking-wider shadow-[1.5px_1.5px_0px_#000] ${
                                isWin 
                                  ? "bg-lime-accent text-charcoal-text" 
                                  : "bg-burnt-orange text-warm-cream"
                              }`}
                            >
                              {isWin ? (uiLanguage === "en" ? "WIN" : "MENANG") : (uiLanguage === "en" ? "LOSS" : "KALAH")}
                            </span>
                            <span className="text-[10px] font-extrabold text-charcoal-text/50">{dateStr}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-3 text-xs md:text-sm font-black text-charcoal-text flex-wrap">
                            <span className="bg-charcoal-text text-warm-cream px-2.5 py-1 rounded-lg text-[9px] tracking-wide uppercase border border-charcoal-text">START</span>
                            <span className="truncate max-w-[140px] sm:max-w-[180px] bg-pure-white px-2 py-0.5 rounded border border-charcoal-text/20 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]">
                              {match.start_article.replace(/_/g, ' ')}
                            </span>
                            <span className="text-charcoal-text/40 font-bold px-0.5">➔</span>
                            <span className="bg-charcoal-text text-warm-cream px-2.5 py-1 rounded-lg text-[9px] tracking-wide uppercase border border-charcoal-text">GOAL</span>
                            <span className="truncate max-w-[140px] sm:max-w-[180px] bg-pure-white px-2 py-0.5 rounded border border-charcoal-text/20 shadow-[1px_1px_0px_rgba(0,0,0,0.05)] font-bold text-lime-deep">
                              {match.end_article.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Match stats & elo change */}
                        <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t border-charcoal-text/10 pt-3 sm:pt-0 sm:border-0 mt-2 sm:mt-0">
                          <div className="text-left sm:text-right font-black">
                            <p className="text-xs text-charcoal-text">
                              🖱️ {match.clicks} Clicks
                            </p>
                            <p className="text-[10px] text-charcoal-text/60 mt-1">
                              ⏱️ {match.duration}s
                            </p>
                          </div>

                          <div
                            className={`flex items-center justify-center font-black text-sm px-3 py-2 rounded-xl border-3 border-charcoal-text shadow-[3px_3px_0px_#000] shrink-0 min-w-[70px] text-center ${
                              isWin 
                                ? "bg-lime-accent text-charcoal-text" 
                                : "bg-burnt-orange text-warm-cream"
                            }`}
                          >
                            {match.elo_change >= 0 ? `+${match.elo_change}` : match.elo_change} ELO
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
